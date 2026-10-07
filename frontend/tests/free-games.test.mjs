import test from 'node:test';
import assert from 'node:assert/strict';
import {FreeGames} from '../backend/modules/freeGames.mjs';
const offer=(extra={})=>({id:1,title:'A real giveaway',type:'Game',status:'Active',platforms:'PC, Steam',gamerpower_url:'https://www.gamerpower.com/a-real-giveaway',end_date:'2026-11-01 00:00:00',...extra});
test('free games load only on request, reject unsafe or expired offers, and coalesce reads',async()=>{
 let reads=0;const api=new FreeGames({fetch:async()=>{reads++;return new Response(JSON.stringify([offer(),offer({id:2,gamerpower_url:'https://evil.example/game'}),offer({id:3,end_date:'2020-01-01 00:00:00'}),offer({id:4,type:'Loot'})]));},now:()=>Date.parse('2026-10-07T12:00:00Z')});
 assert.equal(reads,0);const [a,b]=await Promise.all([api.list(),api.list()]);assert.equal(reads,1);assert.equal(a.state,'ready');assert.equal(a.offers.length,1);assert.deepEqual(a,b);assert.equal((await api.offer(1)).url,offer().gamerpower_url);await assert.rejects(api.offer(2),/unavailable/);
});
test('offline refresh retains labelled cached offers and expiry removes them',async()=>{
 let time=Date.parse('2026-10-07T12:00:00Z'),offline=false;const api=new FreeGames({fetch:async()=>{if(offline)throw Error('network');return new Response(JSON.stringify([offer()]));},now:()=>time});
 await api.list();offline=true;const cached=await api.list(true);assert.equal(cached.state,'cached');assert.equal(cached.offers.length,1);time=Date.parse('2026-12-01T12:00:00Z');assert.equal((await api.list()).offers.length,0);
});
test('unavailable data is never a successful empty list; genuine no offers is empty ready',async()=>{
 assert.equal((await new FreeGames({fetch:async()=>new Response('{}',{status:500})}).list()).state,'unavailable');
 assert.equal((await new FreeGames({fetch:async()=>new Response('{}',{status:201})}).list()).state,'ready');
 assert.equal((await new FreeGames({fetch:async()=>new Response('{}')}).list()).state,'unavailable');
});
test('expiry keeps the supplied time and never extends a cached giveaway to midnight',async()=>{
 let time=Date.parse('2026-10-07T08:00:00Z');const api=new FreeGames({fetch:async()=>new Response(JSON.stringify([offer({end_date:'2026-10-07 12:00:00'})])),now:()=>time});
 assert.equal((await api.list()).offers.length,1);time=Date.parse('2026-10-07T12:01:00Z');assert.equal((await api.list()).offers.length,0);await assert.rejects(api.offer(1),/unavailable/);
});
