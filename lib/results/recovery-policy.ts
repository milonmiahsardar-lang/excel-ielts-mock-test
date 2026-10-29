// Recovery classification is deliberately independent of React and transport.
type Failure={status?:number;code?:string};
export type RecoveryFailure={error:unknown;sequence:number};
export function recoveryKind(error:unknown):'temporary'|'reconcile'|'critical'{
 const value=error as Failure|null,status=value?.status;
 if(status===undefined||status<400||status===408||status===429||(status>=500&&status<=599))return 'temporary';
 if(status===409&&['LEASE_EXPIRED','SECTION_CHANGED','TEST_COMPLETED','ANSWER_WINDOW_CLOSED'].includes(value?.code||''))return 'reconcile';
 // Unknown 409s, authorization and audio-integrity errors are never ignored.
 return 'critical';
}
export function staleRecoveryFailure(error:unknown,sequence:number,confirmedSequence=0){
 return recoveryKind(error)!=='critical'&&sequence>0&&sequence<confirmedSequence;
}
export function recoverySnapshot(value:unknown,skill:string){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const snapshot=value as Record<string,unknown>;
 if(skill==='writing')return typeof snapshot.task1==='string'&&snapshot.task1.length<=100000&&typeof snapshot.task2==='string'&&snapshot.task2.length<=100000;
 return ['reading','listening'].includes(skill)&&Object.entries(snapshot).every(([key,answer])=>/^(?:[1-9]|[1-3]\d|40)$/.test(key)&&typeof answer==='string'&&answer.length<=500);
}
type State={id:string;testId:number;stage:string;serverNow:number;deadline:number|null;pendingSection?:string|null;instructionsConfirmed?:boolean;completionAcknowledged?:boolean;audioPosition:number};
const stages=['NOT_STARTED','LISTENING_ACTIVE','LISTENING_COMPLETED','READING_ACTIVE','READING_COMPLETED','WRITING_ACTIVE','COMPLETED'];
export function acceptRecoveryStatus(current:State|null,incoming:State){
 if(!current||current.id!==incoming.id||current.testId!==incoming.testId)return true;
 const before=stages.indexOf(current.stage),after=stages.indexOf(incoming.stage);
 if(after<0||after<before||incoming.serverNow<current.serverNow)return false;
 if(after===before){
  if(current.pendingSection&&!incoming.pendingSection)return false;
  if(current.pendingSection===incoming.pendingSection){
   if(current.instructionsConfirmed&&!incoming.instructionsConfirmed)return false;
   if(current.completionAcknowledged&&!incoming.completionAcknowledged)return false;
  }
  if(incoming.audioPosition<current.audioPosition)return false;
 }
 return true;
}
// A bounded communication grace is not an extension of any examination clock.
// After two minutes without a successful authenticated owner reconciliation,
// or at the existing section deadline, require explicit recovery.
export function safeRecoveryContinuation(state:State|null,test:number,id:string,confirmedAt:number|undefined,snapshot:boolean,now:number){
 if(!state||state.id!==id||state.testId!==test||!snapshot||confirmedAt===undefined||now-confirmedAt>=120000)return false;
 if(!['LISTENING_ACTIVE','LISTENING_COMPLETED','READING_ACTIVE','READING_COMPLETED','WRITING_ACTIVE'].includes(state.stage))return false;
 return state.deadline===null||state.deadline>state.serverNow+(now-confirmedAt);
}
