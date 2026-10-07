export interface SetupInspection {
  checkedAt: string;
  hardware: {cpu:string|null;memoryGB:number;os:string;gpus:string[];display?:string|null}|null;
  stores: Record<'steam'|'epic'|'gog','installed'|'absent'|'unknown'>;
}
