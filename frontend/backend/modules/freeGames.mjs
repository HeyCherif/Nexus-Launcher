const endpoint='https://www.gamerpower.com/api/filter?platform=pc+steam+epic-games-store+gog+drm-free&type=game&sort-by=date';
export class FreeGames {
 constructor({fetch=globalThis.fetch,now=Date.now}={}){this.fetch=fetch;this.now=now;}
 async list(force=false){
  if(this.pending)return this.pending;
  if(!force&&this.cache&&this.now()<this.nextCheck)return this.result();
  this.pending=this.refresh().finally(()=>{this.pending=null;});return this.pending;
 }
 async refresh(){
  try{
   const response=await this.fetch(endpoint,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
   if(response.status!==201&&!response.ok)throw Error('unavailable');
   let rows=[];
   if(response.status!==201){
    if(!response.body)throw Error('unavailable');const reader=response.body.getReader(),chunks=[];let length=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2*1024**2)throw Error('oversized');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    rows=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!Array.isArray(rows)||rows.length>1000)throw Error('unavailable');
   }
   const seen=new Set();this.cache=rows.flatMap(row=>{
    if(!row||!Number.isSafeInteger(row.id)||row.id<=0||seen.has(row.id)||row.type!=='Game'||row.status!=='Active'||typeof row.title!=='string'||!row.title.trim()||typeof row.platforms!=='string'||!/(^|,\s*)(PC|Steam|Epic Games Store|GOG|DRM-Free)(,|$)/i.test(row.platforms))return [];
    let url;try{url=new URL(row.gamerpower_url);if(url.protocol!=='https:'||!['www.gamerpower.com','gamerpower.com'].includes(url.hostname)||url.username||url.password||url.port) return [];}catch{return [];}
    // Normalize provider timestamps consistently as UTC when no offset is supplied.
    // Do not display a timezone-specific promise; the provider page confirms availability.
    const raw=typeof row.end_date==='string'?row.end_date.trim().replace(' ','T'):'';
    const timestamp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/.test(raw)?raw+(/(Z|[+-]\d{2}:\d{2})$/.test(raw)?'':'Z'):'';
    const expiresAt=timestamp&&Number.isFinite(Date.parse(timestamp))?new Date(timestamp).toISOString():null;
    seen.add(row.id);return [{id:row.id,title:row.title.trim().slice(0,200),platforms:row.platforms.slice(0,200),url:url.href,expiresAt}];
   }).slice(0,100);
   this.checkedAt=new Date(this.now()).toISOString();this.failed=false;this.nextCheck=this.now()+10*60*1000;
  }catch{this.failed=true;this.nextCheck=this.now()+30000;}
  return this.result();
 }
 result(){return {source:'GamerPower',state:this.cache?(this.failed?'cached':'ready'):'unavailable',checkedAt:this.checkedAt||null,offers:(this.cache||[]).filter(offer=>!offer.expiresAt||Date.parse(offer.expiresAt)>this.now()).map(offer=>({...offer}))};}
 async offer(id){if(!Number.isSafeInteger(id)||id<=0)throw Error('offer-unavailable');const offer=(await this.list()).offers.find(offer=>offer.id===id);if(!offer)throw Error('offer-unavailable');return offer;}
}
