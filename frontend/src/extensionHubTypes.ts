import type {GameActivityResult} from './activityTypes';
export interface ActivityOverview extends GameActivityResult {totalSeconds?:number;completedSessions?:number;retainedSessions?:number;}
export interface FreeGamesResult {source:'GamerPower';state:'ready'|'cached'|'unavailable';checkedAt:string|null;offers:Array<{id:number;title:string;platforms:string;url:string;expiresAt:string|null}>;}
