import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SteamAchievements } from '../backend/steamAchievements.mjs';
import { createStoreClientOpener, SteamConnection } from '../backend/storeClient.mjs';
import * as storeClient from '../backend/storeClient.mjs';

test('Steam game launch uses the verified client and official app id',async()=>{
  assert.equal(typeof storeClient.createStoreGameLauncher,'function');
  const calls=[];
  const launch=storeClient.createStoreGameLauncher({
    platform:'win32',env:{},registryPaths:async()=>['D:\\Steam\\steam.exe'],fileStat:async()=>({isFile:()=>true}),
    spawnClient:(path,args,options)=>{calls.push({path,args,options});const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;},
  });
  const child=await launch({provider:'steam',appId:'1952920'});
  assert.equal(child.pid,undefined);
  assert.equal(calls[0].path,'D:\\Steam\\steam.exe');
  assert.deepEqual(calls[0].args,['-applaunch','1952920']);
  assert.equal(calls[0].options.shell,false);
  await assert.rejects(launch({provider:'steam',appId:'../../calc'}),/invalid-store-launch/);
});

test('Epic manifest arguments are split without a command shell',()=>{
  assert.equal(typeof storeClient.splitWindowsCommandLine,'function');
  assert.deepEqual(storeClient.splitWindowsCommandLine('-AUTH_LOGIN=unused -log="C:\\Game Logs\\run.log" ""'),['-AUTH_LOGIN=unused','-log=C:\\Game Logs\\run.log','']);
  assert.deepEqual(storeClient.splitWindowsCommandLine('  -windowed   -locale=fr  '),['-windowed','-locale=fr']);
});

test('authorized executable launch applies Epic arguments with the game working directory',async()=>{
  assert.equal(typeof storeClient.createGameProcessLauncher,'function');
  const calls=[];
  const launch=storeClient.createGameProcessLauncher({
    storeGameLauncher:async target=>({target,pid:7}),
    spawnGame:(path,args,options)=>{calls.push({path,args,options});const child=new EventEmitter();child.pid=9;child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;},
  });
  const child=await launch({type:'executable',file:'D:\\Epic\\Game\\Binaries\\Game.exe',arguments:'-windowed -log="D:\\Game Logs\\run.log"',folderPath:'D:\\Epic\\Game',provider:'epic'});
  assert.equal(child.pid,9);
  assert.deepEqual(calls[0].args,['-windowed','-log=D:\\Game Logs\\run.log']);
  assert.equal(calls[0].options.cwd,'D:\\Epic\\Game\\Binaries');
  assert.equal(calls[0].options.shell,false);
});

test('detects each installed launcher in a custom registry location and opens only its executable',async()=>{
  for(const [provider,name] of [['steam','steam.exe'],['epic','EpicGamesLauncher.exe'],['gog','GalaxyClient.exe']]){
    const file=`D:\\Launchers\\${name}`, calls=[];
    const open=createStoreClientOpener({platform:'win32',registryPaths:async()=>[file],fileStat:async path=>({isFile:()=>path===file}),spawnClient:(path,args,options)=>{
      calls.push({path,args,options});const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;
    }});
    assert.equal(await open(provider),true);assert.equal(calls[0].path,file);assert.deepEqual(calls[0].args,[]);assert.equal(calls[0].options.shell,false);
  }
});
test('absent, invalid or failing launcher falls back without an unknown-protocol prompt',async()=>{
  for(const registry of [[],['relative\\steam.exe'],['D:\\bad\\other.exe']]){
    const open=createStoreClientOpener({platform:'win32',env:{},registryPaths:async()=>registry,fileStat:async()=>{throw Error('ENOENT');},spawnClient:()=>{throw Error('must not run');}});
    assert.equal(await open('steam'),false);
  }
  const open=createStoreClientOpener({platform:'win32',registryPaths:async()=>['D:\\Steam\\steam.exe'],fileStat:async()=>({isFile:()=>true}),spawnClient:()=>{const child=new EventEmitter();queueMicrotask(()=>child.emit('error',Error('cannot launch')));return child;}});
  assert.equal(await open('steam'),false);await assert.rejects(open('../epic'),/Unsupported/);
});
function connection(overrides={}){
  const events=[];let linked=false;
  const local={status:async()=>({linked:false,configured:false,storageAvailable:true,local:true}),connect:async()=>{events.push('local');return local.status();},clearAccount:async()=>{},getLibrary:async()=>({state:'unconfigured',games:[]}),getAchievements:async()=>({state:'unconfigured',achievements:[]})};
  const web={status:async()=>({linked,configured:false,storageAvailable:true,steamId:linked?'76561198000000000':undefined}),linkAccount:async id=>{events.push(id);linked=true;return web.status();},clearAccount:async()=>{linked=false;}};
  const browser={connect:async()=>{events.push('browser');return {steamId:'76561198000000000'};},cancel:()=>events.push('cancel')};
  return {service:new SteamConnection({local,web,browser,openClient:async()=>true,...overrides}),events};
}
test('installed Steam opens client and refreshes local data without browser authentication',async()=>{
  const {service,events}=connection();await service.connect();assert.deepEqual(events,['local']);
});
test('missing Steam verifies browser identity without claiming synchronized hours or achievements',async()=>{
  const {service,events}=connection({openClient:async()=>false});const status=await service.connect();
  assert.deepEqual(events,['browser','76561198000000000']);assert.equal(status.linked,true);assert.equal(status.configured,false);assert.equal(status.local,false);
  assert.equal((await service.getLibrary()).state,'unavailable');assert.equal((await service.getAchievements(10)).state,'unavailable');
  await service.clearAccount();assert.equal((await service.status()).linked,false);
});
test('browser cancellation never links an account',async()=>{
  const {service,events}=connection({openClient:async()=>false,browser:{connect:async()=>({error:'cancelled'}),cancel(){}}});
  assert.equal((await service.connect()).error,'cancelled');assert.deepEqual(events,[]);
});
test('disconnect during client detection prevents a late local reconnection',async()=>{
  let release;const {service,events}=connection({openClient:()=>new Promise(resolve=>{release=resolve;})});
  const pending=service.connect();await service.clearAccount();release(true);await pending;
  assert.deepEqual(events,['cancel']);
});
test('cancelling during real encrypted identity persistence does not leave a linked account',async t=>{
 const root=await mkdtemp(join(tmpdir(),'nexus-browser-cancel-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const storage={isEncryptionAvailable:()=>true,encryptString:value=>Buffer.from(value),decryptString:value=>value.toString()};
 const web=new SteamAchievements(root,storage),original=web.atomic.bind(web);let release,entered;
 const ready=new Promise(resolve=>{entered=resolve;});web.atomic=async(...args)=>{entered();await new Promise(resolve=>{release=resolve;});return original(...args);};
 const {service}=connection({openClient:async()=>false,web});const pending=service.connect();await ready;service.cancel();release();await pending;
 assert.equal((await web.status()).linked,false);await assert.rejects(access(web.file),{code:'ENOENT'});
});
