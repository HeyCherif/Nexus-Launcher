import { ReplayPluginCard } from '../components/ReplayPluginCard';
import { SavesPluginCard } from '../components/SavesPluginCard';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MagnifyingGlass, PuzzlePiece } from '@phosphor-icons/react';
import { SteamNotifications } from '../components/SteamNotifications';
import { extensionsCopy } from '../extensionsCopy';
import { useNexusStore } from '../state/useNexusStore';
import {ExtensionHubCard} from '../components/ExtensionHubCard';
export function ExtensionsScreen(){
 const locale=useNexusStore(state=>state.locale),copy=extensionsCopy[locale];
 const [category,setCategory]=useState('all'),[query,setQuery]=useState('');
 const entries=[
  {id:'activity',category:'activity',name:'Nexus Activity',description:copy.activity,content:<ExtensionHubCard kind="activity"/>},
  {id:'free-games',category:'discover',name:copy.free,description:'GamerPower',content:<ExtensionHubCard kind="free-games"/>},
  {id:'replay',category:'capture',name:'Nexus Replay',description:copy.replay,content:<ReplayPluginCard/>},
  {id:'saves',category:'saves',name:'Nexus Saves',description:copy.saves,content:<SavesPluginCard/>},
  {id:'achievements',category:'achievements',name:copy.notifications,description:'Steam Achievement Notifier',content:<article className="nexus-plugin-card extension-notifications"><header><span className="screen-kicker">STEAM ACHIEVEMENT NOTIFIER</span><h2>{copy.notifications}</h2></header><SteamNotifications locale={locale}/></article>},
 ];
 const matches=(entry:typeof entries[number])=>(category==='all'||category===entry.category)&&`${entry.name} ${entry.description}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale));
 const count=entries.filter(matches).length;
 return <section className="screen downloads-screen nexus-plugins-screen extensions-screen" aria-labelledby="extensions-title">
  <header className="screen-heading"><div><span className="screen-kicker">NEXUS · {copy.kicker}</span><h1 id="extensions-title">{copy.title}</h1><p>{copy.subtitle}</p></div><span className="extensions-emblem" aria-hidden="true"><PuzzlePiece size={44} weight="duotone"/></span></header>
  <div className="extensions-toolbar"><div className="extensions-filters" role="group" aria-label={copy.categories}>{(['all','activity','discover','capture','saves','achievements'] as const).map(id=><button key={id} type="button" aria-pressed={category===id} onClick={()=>setCategory(id)}>{copy[id]}</button>)}</div><label className="extensions-search"><MagnifyingGlass size={19}/><input type="search" aria-label={copy.search} placeholder={copy.search} value={query} onChange={event=>setQuery(event.target.value)}/></label></div>
  {!window.nexusDesktop&&<p className="extensions-preview">{copy.desktop}</p>}
  {!count&&<div className="extensions-empty" role="status"><PuzzlePiece size={28}/><p>{copy.empty}</p><button className="screen-tool" type="button" onClick={()=>{setCategory('all');setQuery('');}}>{copy.reset}</button></div>}
  <div className="extensions-grid">{entries.map(entry=><div key={entry.id} data-extension={entry.id} hidden={!matches(entry)}><span className="extension-category">{copy[entry.category as 'activity'|'discover'|'capture'|'saves'|'achievements']}</span>{entry.content}</div>)}</div>
  <footer className="extensions-footer"><p>{copy.optional}</p><Link className="screen-tool" to="/captures">{copy.gallery}<ArrowUpRight size={17}/></Link></footer>
 </section>;
}
