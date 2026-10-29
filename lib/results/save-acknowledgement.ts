export type SavedSkill='listening'|'reading'|'writing';
export type SaveAcknowledgement={skill:SavedSkill;requestedRevision:number|null;committedRevision:number|null;matches:boolean;outcome:'accepted'|'duplicate'|'equivalent'|'superseded'|'closed'};
type SavedData={answerRevisions?:Record<string,number>;writingDraft?:unknown;writing?:unknown;listening?:unknown;reading?:unknown};
export function snapshotEncoding(skill:SavedSkill,value:unknown){
 const data=(value&&typeof value==='object'&&!Array.isArray(value)?value:{}) as Record<string,unknown>;
 if(skill==='writing')return JSON.stringify([typeof data.task1==='string'?data.task1:'',typeof data.task2==='string'?data.task2:'']);
 return JSON.stringify(Array.from({length:40},(_,i)=>typeof data[String(i+1)]==='string'?data[String(i+1)]:''));
}
export function storedSnapshot(data:SavedData,skill:SavedSkill):unknown{
 if(skill==='writing')return data.writingDraft??data.writing??{};
 const result=data[skill] as {questions?:{number:number;answer:string}[]}|undefined;
 return Object.fromEntries((result?.questions??[]).map(q=>[String(q.number),q.answer]));
}
export function saveAcknowledgement(data:SavedData,skill:SavedSkill,incoming:unknown,revision:unknown,accepted=false,closed=false):SaveAcknowledgement{
 const requestedRevision=typeof revision==='number'&&Number.isSafeInteger(revision)&&revision>=0?revision:null;
 const committedRevision=data.answerRevisions?.[skill]??null;
 const matches=snapshotEncoding(skill,incoming)===snapshotEncoding(skill,storedSnapshot(data,skill));
 return {skill,requestedRevision,committedRevision,matches,outcome:accepted?'accepted':matches?(requestedRevision===committedRevision?'duplicate':'equivalent'):closed?'closed':'superseded'};
}
export function isSaveAcknowledgement(value:unknown,skill:SavedSkill,revision:unknown):value is SaveAcknowledgement{
 if(!value||typeof value!=='object')return false;
 const ack=value as SaveAcknowledgement;
 return ack.skill===skill&&ack.requestedRevision===revision&&(revision===null||(typeof revision==='number'&&Number.isSafeInteger(revision)&&revision>=0))&&(ack.committedRevision===null||(Number.isSafeInteger(ack.committedRevision)&&ack.committedRevision>=0))&&typeof ack.matches==='boolean'&&(ack.matches?['accepted','duplicate','equivalent'].includes(ack.outcome):['superseded','closed'].includes(ack.outcome));
}
export function confirmsSave(value:unknown,skill:SavedSkill,revision:unknown):value is SaveAcknowledgement{return isSaveAcknowledgement(value,skill,revision)&&value.matches;}
