import * as Dialog from '@radix-ui/react-dialog';
import {ArrowClockwise,ArrowUpRight,ChartLine,Gift,X} from '@phosphor-icons/react';
import {useEffect,useState} from 'react';
import {useNexusStore} from '../state/useNexusStore';
import {extensionHubCopy} from '../extensionHubCopy';
import type {ActivityOverview,FreeGamesResult} from '../extensionHubTypes';

export function ExtensionHubCard({kind}:{kind:'activity'|'free-games'}){
 const locale=useNexusStore(state=>state.locale),c=extensionHubCopy[locale],api=window.nexusDesktop,activity=kind==='activity';
 const [open,setOpen]=useState(false),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(false),[result,setResult]=useState<ActivityOverview|FreeGamesResult>();
 const title=activity?c.activity:c.free,Icon=activity?ChartLine:Gift;
 useEffect(()=>{
  if(!open)return;let alive=true;const controller=new AbortController();setBusy(true);setError(false);setResult(undefined);
  const load=async()=>{
   try{
    let data:ActivityOverview|FreeGamesResult;
    if(activity){if(!api?.getActivityOverview)throw Error('unavailable');data=await api.getActivityOverview();}
    else if(api?.getFreeGames)data=await api.getFreeGames(revision>0);
    else {const response=await fetch(`/api/library/free-games${revision?'?refresh=true':''}`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});if(!response.ok)throw Error('unavailable');data=await response.json() as FreeGamesResult;}
    if(alive){setResult(data);setError(data.state==='unavailable');}
   }catch{if(alive)setError(true);}finally{if(alive)setBusy(false);}
  };
  void load();const remove=activity?api?.onActivityChanged?.(()=>setRevision(value=>value+1)):undefined;
  return()=>{alive=false;controller.abort();remove?.();};
 },[open,revision,activity,api]);
 const duration=(seconds:number)=>`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min`;
 const date=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'});
 const offerLink=(url:string)=>{try{const value=new URL(url);return value.protocol==='https:'&&!value.username&&!value.password&&!value.port&&['www.gamerpower.com','gamerpower.com'].includes(value.hostname)?value.href:undefined;}catch{return undefined;}};
 return <Dialog.Root open={open} onOpenChange={setOpen}><article className="nexus-plugin-card extension-hub-card"><div className="nexus-plugin-symbol"><Icon weight="duotone"/></div><div className="nexus-plugin-heading"><h2>{title}</h2><p>{activity?c.activityDesc:c.freeDesc}</p><small>{c.included}</small></div><div className="capture-actions">{activity&&!api?.getActivityOverview?<span className="plugin-preview-platform">{c.desktop}</span>:<Dialog.Trigger asChild><button type="button"><Icon size={18}/>{activity?c.openActivity:c.openFree}</button></Dialog.Trigger>}</div><details><summary>{c.about}</summary><p>{activity?c.aboutActivity:c.aboutFree}</p></details></article>
 <Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="account-dialog extension-hub-dialog"><header><div><span className="screen-kicker">NEXUS · {c.included}</span><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{activity?c.scope:c.disclaimer}</Dialog.Description></div><Dialog.Close asChild><button className="console-icon-action" aria-label={c.close} type="button"><X size={22}/></button></Dialog.Close></header>
 <div className="extension-hub-toolbar"><button className="screen-tool" disabled={busy} type="button" onClick={()=>setRevision(value=>value+1)}><ArrowClockwise size={18}/>{c.refresh}</button>{result?.state==='cached'&&<span role="status">{c.cached}</span>}</div>
 <div className="extension-hub-content" aria-busy={busy}>
 {busy?<p role="status">{c.loading}</p>:error?<p role="status">{c.error}</p>:result&&'sessions' in result?<>{result.state==='ready'&&<div className="extension-activity-stats"><div><small>{c.total}</small><strong>{duration(result.totalSeconds??0)}</strong></div><div><small>{c.sessions}</small><strong>{result.completedSessions??0}</strong></div></div>}<h3>{c.history}</h3>{!result.sessions.length?<p>{c.emptyActivity}</p>:<ul className="extension-session-list">{result.sessions.map(session=><li key={session.sessionId}><span><strong>{session.title}</strong><time dateTime={session.startedAt}>{Number.isFinite(Date.parse(session.startedAt))?date.format(new Date(session.startedAt)):'—'}</time></span><span>{session.state==='running'?c.running:session.durationSeconds===null?c.interrupted:duration(session.durationSeconds)}</span></li>)}</ul>}</>:result&&'offers' in result?<>{!result.offers.length?<p>{c.emptyFree}</p>:<ul className="extension-offer-list">{result.offers.map(offer=>{const url=offerLink(offer.url);if(!url)return null;return <li key={offer.id}><span><strong>{offer.title}</strong><small>{offer.platforms}</small></span>{api?.openFreeGame?<button className="screen-tool" type="button" onClick={()=>void api.openFreeGame(offer.id).catch(()=>setError(true))}>{c.offer}<ArrowUpRight size={16}/></button>:<a className="screen-tool" href={url} target="_blank" rel="noreferrer">{c.offer}<ArrowUpRight size={16}/></a>}</li>;})}</ul>}</>:null}
 </div>{!activity&&<footer><a href="https://www.gamerpower.com" target="_blank" rel="noreferrer">{c.provider}</a></footer>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
