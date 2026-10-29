import "server-only";
import { saveAcknowledgement, snapshotEncoding } from "./save-acknowledgement";
import { acceptDraftRevision, answerWindowOpen, progress, requireLease, requireSection } from "./lifecycle";
import { assignmentFor, authorizeAttempt } from "./assignments";
import { createHash, randomUUID } from "node:crypto";
import { db, transaction } from "./db";
import { score, wordCount, writingBands, defaultBands } from "./scoring";
import { reject, text } from "./http";
import type { Answers, Criteria, KeyConfig, Skill, Submission, User } from "./types";
import { includesModule, modeOf, testName, type TestMode } from "./modes";
import { requireFreshMaterial } from "./exposure";
import { purposeOf } from "./assessment-purpose";
export function audit(actor: string,event: string,target: string) {db().prepare("INSERT INTO audit VALUES(?,?,?,?,?)").run(randomUUID(),actor,event,target,new Date().toISOString());}
export function config(test: number,skill: Skill): KeyConfig|null {const row=db().prepare("SELECT config FROM answer_keys WHERE test_id=? AND skill=?").get(test,skill);return row?JSON.parse(String(row.config)):null;}
function scoredWithRevision(a: Answers,c: KeyConfig|null) {
 const result=score(a,c);
 return c?{...result,keyRevision:createHash("sha256").update(JSON.stringify(c)).digest("hex")}:result;
}
export function emptyConfig(): KeyConfig {return {approved:false,questions:{},groups:[],bands:defaultBands};}
export function answers(value: unknown): Answers {if(!value||typeof value!=="object"||Array.isArray(value))reject(400,"Invalid answers.");const result: Answers={};for(const [key,v] of Object.entries(value)){if(!/^(?:[1-9]|[1-3]\d|40)$/.test(key))reject(400,"Invalid question number.");if(Array.isArray(v)){if(v.length>7)reject(400,"Too many selected answers.");result[key]=v.map(a=>text(a,50)).join(",");}else result[key]=text(v,500);}return result;}
export function start(user: User,test: number,owner?:string,mode:TestMode="full") {return transaction(()=>{
  const assignment=assignmentFor(user,test,false,true,mode);
  const existing=db().prepare("SELECT * FROM attempts WHERE assignment_id=? AND student_id=? AND submitted_at IS NULL").get(String(assignment.id),user.id);
  if(existing){const state=progress(existing);
   if(state.stage!=="NOT_STARTED"&&(!owner||state.lease_owner!==owner))reject(403,"Unfinished tests cannot be resumed. Ask your administrator to reassign this test for a fresh attempt.");
   if(state.stage==="NOT_STARTED"){
    assignmentFor(user,test,false,false,mode);
    if(assignment.purpose!=="repeat")requireFreshMaterial(user.id,test,mode,String(existing.id));
    db().prepare("UPDATE attempts SET purpose=? WHERE id=?").run(assignment.purpose==="repeat"?"repeat":"fresh",String(existing.id));
   }
   return {id:String(existing.id),testId:test,mode,startedAt:String(existing.started_at),studentId:user.id};}
  assignmentFor(user,test,false,false,mode);
  if(assignment.purpose!=="repeat")requireFreshMaterial(user.id,test,mode);
  const id=randomUUID(),startedAt=new Date().toISOString();
  db().prepare("INSERT INTO attempts(id,student_id,test_id,started_at,assignment_id,mode,purpose) VALUES(?,?,?,?,?,?,?)").run(id,user.id,test,startedAt,String(assignment.id),mode,assignment.purpose==="repeat"?"repeat":"fresh");
  db().prepare("UPDATE test_assignments SET status='IN_PROGRESS' WHERE id=?").run(String(assignment.id));
  progress({id,test_id:test,mode});return {id,testId:test,mode,startedAt,studentId:user.id};
});}
export function getSubmission(id: string): Submission|null {const row=db().prepare("SELECT a.data,a.released,u.name,u.registration_id,u.contact FROM attempts a JOIN users u ON u.id=a.student_id WHERE a.id=? AND a.submitted_at IS NOT NULL").get(id);if(!row)return null;const submission=JSON.parse(String(row.data)) as Submission;return {...submission,student:{...submission.student,name:String(row.name),registrationId:String(row.registration_id),contact:String(row.contact)},released:!!row.released};}
// Called inside a transaction by both browser submission and deadline recovery.
function completeSubmission(user: User,row: Record<string,unknown>,listening: Answers,reading: Answers,task1: string,task2: string) {
  const id=String(row.id),test=Number(row.test_id),mode=modeOf(row),purpose=purposeOf(row);
  const notTaken=()=>({raw:null,band:null,questions:[]});
  const savedData=row.data?JSON.parse(String(row.data)):{};
  const submission: Submission={answerRevisions:savedData.answerRevisions??{},saveNotices:savedData.saveNotices??{},id,mode,purpose,student:user,testId:test,testName:testName(test,mode)+(purpose==="repeat"?" · Repeat practice":""),startedAt:String(row.started_at),submittedAt:new Date().toISOString(),listening:includesModule(mode,"listening")?scoredWithRevision(listening,config(test,"listening")):notTaken(),reading:includesModule(mode,"reading")?scoredWithRevision(reading,config(test,"reading")):notTaken(),writing:{task1,task2,task1WordCount:wordCount(task1),task2WordCount:wordCount(task2)},marking:null,released:false,speaking:null};
  db().prepare("UPDATE attempts SET submitted_at=?,data=? WHERE id=?").run(submission.submittedAt,JSON.stringify(submission),id);
  db().prepare("UPDATE attempt_progress SET stage='COMPLETED',lease_owner=NULL,lease_until=0 WHERE attempt_id=?").run(id);
  db().prepare("UPDATE test_assignments SET status='SUBMITTED',attempts_used=attempts_used+1 WHERE id=?").run(String(row.assignment_id));
  db().prepare("INSERT INTO notification_outbox VALUES(?,?,?,?,NULL)").run(randomUUID(),id,"mock-test.submitted",submission.submittedAt);
  audit(user.id,"submission.created",id);return submission;
}

// Called within the existing lifecycle transaction after final answers are stored.
export function completeSingleModule(user:User,row:Record<string,unknown>,notice?:string) {
  const mode=modeOf(row),state=progress(row);
  if(mode!=="listening"&&mode!=="reading")reject(409,"This assignment must finish through Writing.");
  if(mode==="listening"&&state.stage!=="LISTENING_COMPLETED")reject(409,"Finish the recording before submitting.");
  if(mode==="reading"&&(!state.deadline||Date.now()<state.deadline||!["READING_ACTIVE","READING_COMPLETED"].includes(state.stage)))reject(409,"Reading submits when its time has finished.");
  const latest=db().prepare("SELECT * FROM attempts WHERE id=?").get(String(row.id))!;
  const draft=latest.data?JSON.parse(String(latest.data)):{};
  if(notice){draft.saveNotices??={};draft.saveNotices[mode]=notice;latest.data=JSON.stringify(draft);}
  const stored=(skill:string)=>Object.fromEntries((draft[skill]?.questions??[]).map((q:{number:number;answer:string})=>[String(q.number),q.answer]));
  return completeSubmission(user,latest,answers(stored("listening")),answers(stored("reading")),"","");
}

export function finalizeExpiredReadingModules(){
 const eligible=`SELECT a.* FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id JOIN test_assignments t ON t.id=a.assignment_id
 WHERE a.mode='reading' AND t.mode='reading' AND a.submitted_at IS NULL AND p.stage IN ('READING_ACTIVE','READING_COMPLETED')
 AND p.pending_section IS NULL AND p.deadline IS NOT NULL AND p.deadline+5000<? AND t.status='IN_PROGRESS'
 AND t.attempts_used<t.attempt_limit AND t.candidate_id=a.student_id AND t.test_id=a.test_id`;
 for(const candidate of db().prepare(eligible+" LIMIT 100").all(Date.now())){
  try{transaction(()=>{const row=db().prepare(eligible+" AND a.id=?").get(Date.now(),String(candidate.id));if(!row)return;
   const account=db().prepare("SELECT id,name,registration_id,contact FROM users WHERE id=? AND role='student'").get(String(row.student_id));if(!account)return;
   completeSingleModule({id:String(account.id),name:String(account.name),registrationId:String(account.registration_id),contact:String(account.contact),role:"student"},row,"Your Reading module was completed from its last server-confirmed answers after the deadline. Any unconfirmed changes could not be included.");
  });}catch(error){console.error("Reading module deadline finalization failed",String(candidate.id),error);}
 }
}

export function finalizeExpiredWriting() {
  // Respect the existing final-save grace period. No candidate session or live
  // tab is needed, but the attempt must still belong to its active assignment.
  const eligible=`SELECT a.* FROM attempts a
    JOIN attempt_progress p ON p.attempt_id=a.id
    JOIN test_assignments t ON t.id=a.assignment_id
    WHERE a.submitted_at IS NULL AND p.stage='WRITING_ACTIVE'
      AND p.pending_section IS NULL AND p.deadline IS NOT NULL AND p.deadline+5000<?
      AND t.status='IN_PROGRESS' AND t.attempts_used<t.attempt_limit
      AND t.candidate_id=a.student_id AND t.test_id=a.test_id`;
  const rows=db().prepare(eligible+" ORDER BY p.deadline LIMIT 100").all(Date.now());
  for(const candidate of rows){
    try{transaction(()=>{
      // Recheck inside the transaction so a browser submission, revocation or
      // reassignment cannot cause duplicate results or consume a fresh attempt.
      const row=db().prepare(eligible+" AND a.id=?").get(Date.now(),String(candidate.id));
      if(!row)return;
      const account=db().prepare("SELECT id,name,registration_id,contact FROM users WHERE id=? AND role='student'").get(String(row.student_id));
      if(!account)return;
      const user: User={id:String(account.id),name:String(account.name),registrationId:String(account.registration_id),contact:String(account.contact),role:"student"};
      const draft=row.data?JSON.parse(String(row.data)):{};
      const stored=(skill:string)=>Object.fromEntries((draft[skill]?.questions??[]).map((q:{number:number;answer:string})=>[String(q.number),q.answer]));
      const writing=draft.writingDraft??{task1:"",task2:""};
      draft.saveNotices??={};draft.saveNotices.writing??="Your Writing response was completed from its last server-confirmed snapshot after the deadline. Any unconfirmed changes could not be included.";row.data=JSON.stringify(draft);
      completeSubmission(user,row,answers(stored("listening")),answers(stored("reading")),text(writing.task1,100000),text(writing.task2,100000));
      audit(user.id,"submission.deadline-finalized",String(row.id));
    });}catch(error){console.error("Writing deadline finalization failed",String(candidate.id),error);}
  }
}
export function submit(user: User,payload: Record<string,unknown>,tabId?:string|null) {return transaction(()=>{
  const id=text(payload.attemptId,80,true),row=db().prepare("SELECT * FROM attempts WHERE id=? AND student_id=?").get(id,user.id);
  if(!row)reject(404,"Test attempt not found.");
  if(payload.testId!==row.test_id)reject(400,"This submission belongs to another test.");
  authorizeAttempt(user,row,!!row.submitted_at);
  if(row.submitted_at){const submission=getSubmission(id)!;return {...submission,saveAcknowledgement:saveAcknowledgement(submission,"writing",payload.writing,payload.revision,false,true)};}
  requireLease(row,tabId);const state=requireSection(row,"writing");
  // The server deadline also applies to direct submission requests.
  if(state.deadline===null||!Number.isFinite(state.deadline)||Date.now()<state.deadline)reject(409,"Writing submits when its time has finished. Please continue your test.");
  const draft=row.data?JSON.parse(String(row.data)):{};
  const stored=(skill:string)=>Object.fromEntries((draft[skill]?.questions??[]).map((q:{number:number;answer:string})=>[String(q.number),q.answer]));
  const listening=answers(stored("listening")),reading=answers(stored("reading"));
  const writing=payload.writing;if(!writing||typeof writing!=="object"||Array.isArray(writing))reject(400,"Writing responses are required.");
  const incoming=writing as Record<string,unknown>;
  // Finish can retry after expiry without accepting late client edits.
  const accepted=answerWindowOpen(state)&&acceptDraftRevision(draft,"writing",payload.revision);
  const w=accepted?incoming:(draft.writingDraft??{task1:"",task2:""});
  if(snapshotEncoding("writing",incoming)!==snapshotEncoding("writing",w)){draft.saveNotices??={};draft.saveNotices.writing="Your test was completed using the previously accepted Writing response. Newer unconfirmed changes were not accepted because the save window had closed or a newer revision was already stored.";}
  draft.writingDraft=w;row.data=JSON.stringify(draft);
  const submission=completeSubmission(user,row,listening,reading,text(w.task1,100000),text(w.task2,100000));
  return {...submission,saveAcknowledgement:saveAcknowledgement(submission,"writing",incoming,payload.revision,accepted,!answerWindowOpen(state))};
});}
export function criteria(value: unknown): Criteria {if(!value||typeof value!=="object"||Array.isArray(value))reject(400,"All writing criteria are required.");const result={} as Criteria;for(const key of ['achievement','coherence','vocabulary','grammar'] as const){const n=(value as Record<string,unknown>)[key];if(typeof n!=="number"||n<0||n>9||!Number.isInteger(n*2))reject(400,"Writing scores must be 0–9 in half-band steps.");result[key]=n;}return result;}
export function mark(user: User,id: string,payload: Record<string,unknown>) {return transaction(()=>{const s=getSubmission(id);if(!s)reject(404,"Submission not found.");if(!includesModule(s.mode,"writing")){s.released=payload.released===true;db().prepare("UPDATE attempts SET released=? WHERE id=?").run(Number(s.released),id);audit(user.id,"submission.release-updated",id);return s;}const task1=criteria(payload.task1),task2=criteria(payload.task2);s.marking={task1,task2,...writingBands(task1,task2),feedback:text(payload.feedback,20000),markedAt:new Date().toISOString(),markedBy:user.id};s.released=payload.released===true;db().prepare("UPDATE attempts SET data=?,released=? WHERE id=?").run(JSON.stringify(s),Number(s.released),id);audit(user.id,"writing.marked",id);return s;});}
export function validateConfig(value: unknown): KeyConfig {
  if(!value||typeof value!=="object"||Array.isArray(value))reject(400,"Invalid key configuration.");const c=value as KeyConfig;
  if(typeof c.approved!=="boolean"||!c.questions||typeof c.questions!=="object"||Array.isArray(c.questions)||!Array.isArray(c.groups)||!Array.isArray(c.bands))reject(400,"Invalid answer-key structure.");
  for(const [n,rule] of Object.entries(c.questions)){if(!/^(?:[1-9]|[1-3]\d|40)$/.test(n)||!rule||!Array.isArray(rule.accepted)||rule.accepted.length===0||rule.accepted.length>30)reject(400,"Each question needs accepted answers.");for(const a of rule.accepted)text(a,500,true);if(rule.maxWords!==undefined&&(!Number.isInteger(rule.maxWords)||rule.maxWords<1||rule.maxWords>10))reject(400,"Invalid word limit.");if(rule.maxWords&&rule.accepted.some(a=>wordCount(a)>rule.maxWords!))reject(400,`Question ${n}: an accepted answer exceeds its word limit.`);}
  if(c.approved&&Array.from({length:40},(_,i)=>c.questions[i+1]).some(r=>!r))reject(400,"Approval requires all 40 answers.");
  const used=new Set<number>();for(const group of c.groups){if(!Array.isArray(group)||group.length<2||group.length>7)reject(400,"Invalid unordered answer group.");for(const n of group){if(!Number.isInteger(n)||n<1||n>40||used.has(n)||!c.questions[n])reject(400,"Invalid or overlapping answer group.");used.add(n);}}
  if(c.bands.length<1||c.bands.length>41)reject(400,"Invalid conversion table.");const thresholds=new Set<number>();for(const b of c.bands){if(!Number.isInteger(b.minimum)||b.minimum<0||b.minimum>40||thresholds.has(b.minimum)||typeof b.band!=="number"||b.band<0||b.band>9||!Number.isInteger(b.band*2))reject(400,"Invalid band conversion.");thresholds.add(b.minimum);}if(!thresholds.has(0))reject(400,"Conversion table must start at zero.");
  const ordered=[...c.bands].sort((a,b)=>a.minimum-b.minimum);if(ordered.some((b,i)=>i>0&&b.band<ordered[i-1].band))reject(400,"Bands must increase with scores.");return c;
}
export function saveConfig(user: User,test: number,skill: Skill,c: KeyConfig) {transaction(()=>{
 validateConfig(c);
 const previous=config(test,skill);
 if(JSON.stringify(previous)===JSON.stringify(c))return;
 // Keep private key revisions for investigating or reversing a scoring change.
 audit(user.id,"answer-key.revision",JSON.stringify({testId:test,skill,previous,next:c}));
 db().prepare("INSERT INTO answer_keys VALUES(?,?,?) ON CONFLICT(test_id,skill) DO UPDATE SET config=excluded.config").run(test,skill,JSON.stringify(c));
 // Draft keys never erase existing grades. Released results remain unchanged.
 if(c.approved)for(const row of db().prepare("SELECT id,data FROM attempts WHERE test_id=? AND submitted_at IS NOT NULL AND released=0").all(test)){
  const s=JSON.parse(String(row.data)) as Submission;
  if(!includesModule(s.mode,skill))continue;
  const a=Object.fromEntries(s[skill].questions.map(q=>[String(q.number),q.answer]));
  const next=scoredWithRevision(a,c);
  audit(user.id,"submission.rescored",JSON.stringify({id:String(row.id),skill,previous:s[skill],next}));
  s[skill]=next;db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(s),String(row.id));
 }
 audit(user.id,"answer-key.updated",`${test}:${skill}`);
});}
