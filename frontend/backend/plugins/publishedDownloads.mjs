import { PluginManager } from './pluginManager.mjs';
const managers=new Map();
const managerFor=id=>{if(!managers.has(id))managers.set(id,new PluginManager(process.cwd(),{id}));return managers.get(id);};
// Preview exposes verified metadata only: no installation, execution or preferences.
export async function publishedDownloads({getManager=managerFor,force=false}={}){
 return Promise.all(['nexus-replay','nexus-saves'].map(async id=>{
  const manager=getManager(id);
  try{if(force)manager.releaseExpires=0;const {manifest,asset}=await manager.resolveRelease(AbortSignal.timeout(30000));
   const expected=`https://github.com/zamakz641-byte/Nexus-Launcher/releases/download/plugin-${id}-v${manifest.version}/${id}-${manifest.version}-win-x64.zip`;
   if(asset.browser_download_url!==expected||!/^\d+\.\d+\.\d+$/.test(manifest.version)||!Number.isSafeInteger(manifest.downloadBytes)||manifest.downloadBytes<=0)throw Error('invalid-release');
   return {id,available:true,version:manifest.version,downloadBytes:manifest.downloadBytes};
  }catch{return {id,available:false,error:'download-unavailable'};}
 }));
}
