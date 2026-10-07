import { cpus, totalmem, type, release } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createStoreClientDetector } from './storeClient.mjs';

const exec=promisify(execFile);
export async function readSetupHardware(){
  const hardware={cpu:cpus()[0]?.model?.trim()||null,memoryGB:Math.round(totalmem()/1024**3),os:`${type()} ${release()}`,gpus:[],display:null};
  if(process.platform==='win32')try{
    const script="$ErrorActionPreference='Stop';[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new();Import-Module (Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules/CimCmdlets/CimCmdlets.psd1') -ErrorAction Stop;$gpu=@(Get-CimInstance Win32_VideoController -ErrorAction Stop);$os=Get-CimInstance Win32_OperatingSystem -ErrorAction Stop;[pscustomobject]@{gpus=@($gpu | ForEach-Object {$_.Name});os=$os.Caption;display=@($gpu | Where-Object {$_.CurrentHorizontalResolution -gt 0} | ForEach-Object {[string]$_.CurrentHorizontalResolution+' × '+[string]$_.CurrentVerticalResolution})} | ConvertTo-Json -Compress";
    const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:8000,maxBuffer:16384});
    const value=JSON.parse(stdout);hardware.gpus=(Array.isArray(value.gpus)?value.gpus:[]).filter(name=>typeof name==='string').slice(0,4);
    if(typeof value.os==='string')hardware.os=value.os;
    hardware.display=Array.isArray(value.display)?value.display[0]||null:null;
  }catch{}
  return hardware;
}
export async function inspectSetup({readHardware=readSetupHardware,detectClient=createStoreClientDetector(),now=()=>new Date().toISOString()}={}){
  const [hardware,...stores]=await Promise.allSettled([readHardware(),...['steam','epic','gog'].map(provider=>detectClient(provider))]);
  return {checkedAt:now(),hardware:hardware.status==='fulfilled'?hardware.value:null,stores:Object.fromEntries(['steam','epic','gog'].map((provider,index)=>[provider,stores[index].status==='fulfilled'?(stores[index].value?'installed':'absent'):'unknown']))};
}
let pendingInspection;
export function inspectLocalSetup(){
  if(!pendingInspection)pendingInspection=inspectSetup().finally(()=>{pendingInspection=null;});
  return pendingInspection;
}
