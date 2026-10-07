import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedDownloads} from '../backend/plugins/publishedDownloads.mjs';
test('preview exposes only verified project archives and honest unavailable state',async()=>{
 const result=await publishedDownloads({getManager:id=>({resolveRelease:async()=>({manifest:{version:'0.1.0',downloadBytes:123},asset:{browser_download_url:id==='nexus-replay'?'https://github.com/zamakz641-byte/Nexus-Launcher/releases/download/plugin-nexus-replay-v0.1.0/nexus-replay-0.1.0-win-x64.zip':'https://other.example/exe'}})})});
 assert.equal(result[0].available,true);assert.equal(result[0].downloadBytes,123);assert.equal(result[0].installed,undefined);assert.deepEqual(result[1],{id:'nexus-saves',available:false,error:'download-unavailable'});
});
