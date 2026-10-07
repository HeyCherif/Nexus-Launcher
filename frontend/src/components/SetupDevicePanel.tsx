import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Cpu, DesktopTower, GameController, CheckCircle, Circle, ArrowClockwise } from '@phosphor-icons/react';
import type { SetupInspection } from '../setupTypes';
import { setupCopy } from '../setupCopy';
import { useNexusStore } from '../state/useNexusStore';
import { applyImageFallback } from '../utils/imageFallback';

export function SetupDevicePanel({open,locale}:{open:boolean;locale:'fr'|'en'}){
 const copy=setupCopy[locale],reduced=useReducedMotion(),revision=useRef(0);
 const [result,setResult]=useState<SetupInspection|null>(null),[state,setState]=useState<'checking'|'ready'|'error'>('checking'),[controller,setController]=useState(false);
 const games=useNexusStore(state=>state.discoveredGames),scanState=useNexusStore(state=>state.libraryScanState);
 const inspect=useCallback(async()=>{
   const id=++revision.current;setState('checking');setResult(null);
   try{
     let value:SetupInspection;
     if(window.nexusDesktop?.inspectSetup)value=await window.nexusDesktop.inspectSetup();
     else{const response=await fetch('/api/library/setup',{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('unavailable');value=await response.json();}
     if(id===revision.current){setResult(value);setState('ready');}
   }catch{if(id===revision.current)setState('error');}
 },[]);
 useEffect(()=>{if(open)void inspect();return()=>{revision.current++;};},[open,inspect]);
 useEffect(()=>{
   if(!open)return;
   const refresh=()=>setController(Boolean(navigator.getGamepads?.().some(gamepad=>gamepad?.connected)));
   refresh();const timer=setInterval(refresh,1000);return()=>clearInterval(timer);
 },[open]);
 const hardware=result?.hardware;
 const facts=[[copy.cpu,hardware?.cpu],[copy.graphics,hardware?.gpus?.join(' · ')],[copy.memory,hardware?.memoryGB?`${hardware.memoryGB} ${copy.memoryUnit}`:undefined],[copy.display,hardware?.display],[copy.os,hardware?.os]];
 return <aside className="setup-device" aria-label={copy.title} aria-busy={state==='checking'}>
   <header><span className="setup-device__symbol"><DesktopTower size={27} weight="duotone"/></span><div><span className="screen-kicker">{copy.device}</span><h2>{copy.title}</h2></div><span className="setup-device__signal" data-ready={state==='ready'}/></header>
   <p className="setup-device__status" role="status">{state==='checking'?copy.checking:state==='error'?copy.error:copy.checked}</p>
   {state==='checking'?<motion.div className="setup-device__scan" animate={reduced?undefined:{opacity:[.25,1,.25]}} transition={{duration:1.4,repeat:Infinity}}/>:null}
   <dl className="setup-device__facts">{facts.map(([label,value],index)=><motion.div key={label} initial={reduced?false:{opacity:0,y:7}} animate={{opacity:1,y:0}} transition={{duration:.25,delay:reduced?0:index*.035}}><dt>{label}</dt><dd>{state==='checking'?'—':value||copy.unknown}</dd></motion.div>)}</dl>
   <div className="setup-device__stores">{(['steam','epic','gog'] as const).map(provider=>{
     const status=result?.stores?.[provider]||'unknown';
     return <div key={provider} data-installed={status==='installed'}>{status==='installed'?<CheckCircle size={16} weight="fill"/>:<Circle size={16}/>}<strong>{{steam:'Steam',epic:'Epic',gog:'GOG'}[provider]}</strong><small>{state==='checking'?'—':status==='installed'?copy.installed:status==='absent'?copy.absent:copy.storeUnknown}</small></div>;
   })}</div>
   <div className="setup-device__input"><GameController size={20}/><span>{controller?copy.controller:copy.keyboard}</span><small>{controller?copy.connected:copy.available}</small></div>
   <footer><small>{copy.local} · {copy.privacy}</small><button className="screen-tool" disabled={state==='checking'} type="button" aria-label={copy.retry} onClick={()=>void inspect()}><ArrowClockwise size={18}/></button></footer>
   {games.length?<div className="setup-collection"><div>{games.slice(0,3).map(game=><img key={game.id} src={game.artwork} alt="" onError={event=>applyImageFallback(event,game.artworkFallbacks||[])}/>)}</div><span><small>{copy.discovery}</small><strong>{games.length} {copy.games}</strong></span>{scanState==='scanning'?<Cpu size={19}/>:<CheckCircle size={19}/>}</div>:null}
 </aside>;
}
