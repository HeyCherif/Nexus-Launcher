import { useEffect, useState } from 'react';
import { ArrowClockwise, Desktop } from '@phosphor-icons/react';
import { useNexusStore } from '../state/useNexusStore';
import { pluginDownloadCopy } from '../pluginDownloadCopy';
type Download={id:string;available:boolean;version?:string;downloadBytes?:number};
let pending:Promise<Download[]>|undefined;
function readDownloads(force=false){
 if(!pending)pending=fetch(`/api/library/plugins${force?'?refresh=true':''}`,{signal:AbortSignal.timeout(35000)}).then(response=>{if(!response.ok)throw Error('unavailable');return response.json() as Promise<Download[]>;}).finally(()=>{pending=undefined;});
 return pending;
}
export function PluginDownloadFallback({id}:{id:'nexus-replay'|'nexus-saves'}){
 const locale=useNexusStore(state=>state.locale),copy=pluginDownloadCopy[locale];
 const [download,setDownload]=useState<Download>(),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;setLoading(true);void readDownloads(revision>0).then(items=>{if(alive)setDownload(items.find(item=>item.id===id));}).catch(()=>{if(alive)setDownload(undefined);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[id,revision]);
 return <div className="plugin-preview-download">{loading?<span role="status">{copy.checking}</span>:download?.available?<><span className="plugin-preview-platform"><Desktop size={18}/>{copy.preview}</span><small>v{download.version} · {new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format((download.downloadBytes||0)/1000000)} MB</small></>:<><span role="status">{copy.unavailable}</span><button type="button" onClick={()=>setRevision(value=>value+1)}><ArrowClockwise size={18}/>{copy.retry}</button></>}</div>;
}
