const key='nexus.startup.enabled.v1';
export function readStartupEnabled():boolean { try{return localStorage.getItem(key)!=='false';}catch{return true;} }
export function writeStartupEnabled(enabled:boolean):void { localStorage.setItem(key,String(enabled)); }
