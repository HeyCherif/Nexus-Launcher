import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('desktop library runtime works without Vite or renderer packages',async()=>{const dir=await mkdtemp(join(tmpdir(),'nexus-runtime-'));try{process.env.NEXUS_CACHE_DIR=dir;const runtime=await import('../backend/libraryRuntime.mjs');const root=join(dir,'games');await mkdir(root);runtime.configureDesktopRuntime({libraryRoot:root});const result=await runtime.desktopScanLibrary(root,true);assert.deepEqual(result.games,[]);assert.equal(runtime.desktopSystemInfo().libraryRoot,root);assert.equal(typeof runtime.desktopSearchCatalog,'function');await assert.rejects(async()=>runtime.desktopLaunchGame(join(dir,'outside.exe'),root),/autorisé/);}finally{await rm(dir,{recursive:true,force:true});}});

test('folder scan rejects crash and bypass helpers before choosing the playable binary',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'nexus-runtime-exe-'));
  try{
    process.env.NEXUS_CACHE_DIR=dir;
    const runtime=await import('../backend/libraryRuntime.mjs');
    const root=join(dir,'God of War Ragnarok');
    await mkdir(join(root,'Game','Binaries','Win64'),{recursive:true});
    await writeFile(join(root,'crs-handler.exe'),'crash helper');
    await writeFile(join(root,'bypass.exe'),'bypass helper');
    const playable=join(root,'Game','Binaries','Win64','GoWR.exe');
    await writeFile(playable,Buffer.alloc(4096));
    runtime.configureDesktopRuntime({libraryRoot:root});
    const result=await runtime.desktopScanLibrary(root,true,true,'God of War Ragnarok');
    assert.equal(result.games[0].executablePath,playable);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('folder scan reaches a game binary after large asset directories',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'nexus-runtime-deep-'));
  try{
    process.env.NEXUS_CACHE_DIR=dir;
    const runtime=await import('../backend/libraryRuntime.mjs');
    const root=join(dir,'BLOODSTRIKE');
    const engine=join(root,'Engine');
    await mkdir(join(engine,'Binaries','Win64'),{recursive:true});
    await writeFile(join(root,'launcher.exe'),'bootstrap');
    await Promise.all(Array.from({length:370},(_,index)=>writeFile(join(engine,`asset-${index}.pak`),'asset')));
    const playable=join(engine,'Binaries','Win64','BloodStrike.exe');
    await writeFile(playable,Buffer.alloc(4096));
    runtime.configureDesktopRuntime({libraryRoot:root});
    const result=await runtime.desktopScanLibrary(root,true,true,'BLOODSTRIKE');
    assert.equal(result.games[0].executablePath,playable);
  }finally{await rm(dir,{recursive:true,force:true});}
});
