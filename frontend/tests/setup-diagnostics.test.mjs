import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSetup } from '../backend/setupDiagnostics.mjs';
import { createStoreClientDetector } from '../backend/storeClient.mjs';

test('reads real device values and store executable presence without returning installation paths',async()=>{
 const result=await inspectSetup({readHardware:async()=>({cpu:'Actual CPU',memoryGB:16,os:'Windows',gpus:['Actual GPU'],display:'1920 × 1080'}),detectClient:async name=>name==='steam'?'D:\\Steam\\steam.exe':null});
 assert.equal(result.hardware.cpu,'Actual CPU');assert.equal(result.hardware.memoryGB,16);assert.deepEqual(result.stores,{steam:'installed',epic:'absent',gog:'absent'});
 assert.doesNotMatch(JSON.stringify(result),/D:\\|steam\.exe/);assert.ok(result.checkedAt);
});
test('failed checks are unavailable instead of invented hardware or absent stores',async()=>{
 const result=await inspectSetup({readHardware:async()=>{throw Error('private details');},detectClient:async()=>{throw Error('private path');}});
 assert.equal(result.hardware,null);assert.deepEqual(result.stores,{steam:'unknown',epic:'unknown',gog:'unknown'});assert.doesNotMatch(JSON.stringify(result),/private/);
});
test('store inspection finds custom install paths without launching anything and ignores stale registrations',async()=>{
 const file='D:\\Apps\\EpicGamesLauncher.exe';
 const detect=createStoreClientDetector({platform:'win32',env:{},registryPaths:async()=>[file],fileStat:async path=>({isFile:()=>path===file})});
 assert.equal(await detect('epic'),file);
 const absent=createStoreClientDetector({platform:'win32',env:{},registryPaths:async()=>[file],fileStat:async()=>{throw Error('ENOENT');}});
 assert.equal(await absent('epic'),null);await assert.rejects(detect('bad'),/Unsupported/);
});
test('registry failure keeps unknown status unless a default executable is verified',async()=>{
 const options={platform:'win32',env:{ProgramFiles:'C:\\Program Files'},registryPaths:async()=>{throw Error('registry inaccessible');}};
 const detect=createStoreClientDetector({...options,fileStat:async()=>{throw Error('ENOENT');}});
 const result=await inspectSetup({readHardware:async()=>null,detectClient:detect});
 assert.deepEqual(result.stores,{steam:'unknown',epic:'unknown',gog:'unknown'});
 const found=createStoreClientDetector({...options,fileStat:async()=>({isFile:()=>true})});
 assert.equal(await found('steam'),'C:\\Program Files\\Steam\\steam.exe');
});
