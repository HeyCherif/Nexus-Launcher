import { stat } from 'node:fs/promises';
import { win32 } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const executableNames = {steam:'steam.exe',epic:'EpicGamesLauncher.exe',gog:'GalaxyClient.exe'};
async function registryPaths(provider) {
  // Fixed registry keys only; no renderer input is interpolated into the command.
  const names = {
    steam:[['HKCU:\\Software\\Valve\\Steam','SteamExe'],['HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\steam.exe','']],
    epic:[['HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\EpicGamesLauncher.exe',''],['HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\EpicGamesLauncher.exe','']],
    gog:[['HKLM:\\SOFTWARE\\GOG.com\\GalaxyClient','clientExecutable'],['HKLM:\\SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient','clientExecutable'],['HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\GalaxyClient.exe','']],
  };
  const protocol={steam:'steam',epic:'com.epicgames.launcher',gog:'goggalaxy'}[provider];
  let script=names[provider].map(([key,name])=>`$entry=Get-Item -LiteralPath '${key}' -ErrorAction SilentlyContinue;if($entry){$value=$entry.GetValue('${name}');if($value){Write-Output $value}}`).join(';');
  script+=`; $entry=Get-Item -LiteralPath 'Registry::HKEY_CLASSES_ROOT\\${protocol}\\shell\\open\\command' -ErrorAction SilentlyContinue;if($entry){$value=$entry.GetValue('');if($value -match '^"([^"\r\n]+\\.exe)"'){Write-Output $Matches[1]}}`;
  if(provider==='gog')for(const key of ['HKLM:\\SOFTWARE\\GOG.com\\GalaxyClient','HKLM:\\SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient'])script+=`; $entry=Get-Item -LiteralPath '${key}' -ErrorAction SilentlyContinue;if($entry){$value=$entry.GetValue('path');if($value){Write-Output (Join-Path $value 'GalaxyClient.exe')}}`;
  try {const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:4000,maxBuffer:8192});return stdout.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);}catch{return [];}
}
export function createStoreClientOpener({platform=process.platform,env=process.env,registryPaths:readRegistry=registryPaths,fileStat=stat,spawnClient=spawn}={}) {
  return async provider=>{
    if(!Object.hasOwn(executableNames,provider))throw Error('Unsupported store provider.');
    if(platform!=='win32')return false;
    const installed=await readRegistry(provider).catch(()=>[]);
    for(const root of [env.ProgramFiles,env['ProgramFiles(x86)'],env.LOCALAPPDATA].filter(Boolean)){
      if(provider==='steam')installed.push(win32.join(root,'Steam','steam.exe'));
      if(provider==='epic')for(const arch of ['Win64','Win32'])installed.push(win32.join(root,'Epic Games','Launcher','Portal','Binaries',arch,'EpicGamesLauncher.exe'));
      if(provider==='gog')installed.push(win32.join(root,'GOG Galaxy','GalaxyClient.exe'));
    }
    for(const file of new Set(installed)){
      if(!win32.isAbsolute(file)||win32.basename(file).toLowerCase()!==executableNames[provider].toLowerCase())continue;
      try{
        if(!(await fileStat(file)).isFile())continue;
        await new Promise((resolve,reject)=>{const child=spawnClient(file,[],{detached:true,stdio:'ignore',windowsHide:false,shell:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
        return true;
      }catch{}
    }
    return false;
  };
}

// Browser OpenID proves identity; it does not grant Web API access to game data.
export class SteamConnection {
  constructor({local,web,browser,openClient}){Object.assign(this,{local,web,browser,openClient});this.generation=0;this.pending=false;}
  async status(){const local=await this.local.status();if(local.linked)return local;const web=await this.web.status();return {...web,configured:false,local:false};}
  async connect(){
    if(this.pending)return {...await this.status(),error:'connection-in-progress'};
    this.pending=true;const revision=this.generation;
    try{
      const opened=await this.openClient('steam');
      if(revision!==this.generation)return this.status();
      if(opened)return this.local.connect();
      if(!(await this.web.status()).storageAvailable)return {...await this.status(),error:'storage-unavailable'};
      if(revision!==this.generation)return this.status();
      const result=await this.browser.connect();
      if(revision!==this.generation)return this.status();
      if(result.error)return {...await this.status(),error:result.error};
      const saved=await this.web.linkAccount(result.steamId,this.web.generation,()=>revision===this.generation);
      if(revision!==this.generation)return {...await this.status(),error:'cancelled'};
      if(saved.error)return saved;
      return this.status();
    }finally{this.pending=false;}
  }
  cancel(){this.generation++;this.browser.cancel();}
  async clearAccount(){this.generation++;this.cancel();await Promise.all([this.local.clearAccount(),this.web.clearAccount()]);return this.status();}
  async getLibrary(...args){const result=await this.local.getLibrary(...args);return result.state==='unconfigured'&&(await this.status()).linked?{...result,state:'unavailable'}:result;}
  async getAchievements(...args){const result=await this.local.getAchievements(...args);return result.state==='unconfigured'&&(await this.status()).linked?{...result,state:'unavailable'}:result;}
  notificationSettings(){return this.local.notificationSettings();}
  saveNotificationSettings(value){return this.local.saveNotificationSettings(value);}
}
