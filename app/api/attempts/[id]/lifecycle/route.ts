import { actor, body, candidatePayload, endpoint, reject, reply, text } from "@/lib/results/http";
import { db, transaction } from "@/lib/results/db";
import { authorizeAttempt } from "@/lib/results/assignments";
import { activateListening, claimLease, observeAudio, progress, publicProgress, requireLease, sectionFor, transition } from "@/lib/results/lifecycle";
import { answers, config } from "@/lib/results/store";
import { score } from "@/lib/results/scoring";
type Context={params:Promise<{id:string}>};
function owned(id:string,userId:string){const row=db().prepare("SELECT * FROM attempts WHERE id=? AND student_id=?").get(id,userId);if(!row)reject(404,"Attempt not found.");return row;}
export async function GET(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),row=owned((await params).id,user.id);authorizeAttempt(user,row,!!row.submitted_at);return reply(publicProgress(row));
});}
export async function POST(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),b=await body(request),{id}=await params;candidatePayload(b);
 const result=transaction(()=>{
  const row=owned(id,user.id);authorizeAttempt(user,row,!!row.submitted_at);
  if(b.testId!==row.test_id)reject(400,"Wrong test.");
  if(b.action==="release"){
   db().prepare("UPDATE attempt_progress SET lease_owner=NULL,lease_until=0 WHERE attempt_id=? AND lease_owner=?").run(id,typeof b.tabId==="string"?b.tabId:"");return publicProgress(row);
  }
  if(row.submitted_at)reject(409,"This test has already been submitted.");
  if(b.action==="claim"){claimLease(row,b.tabId);return publicProgress(row);}
  requireLease(row,b.tabId);
  if(b.action==="suspend"){
   const state=progress(row),skill=sectionFor(state.stage);
   if(b.skill===skill&&b.snapshot&&(!state.deadline||Date.now()<=state.deadline+5000)){
    const draft=row.data?JSON.parse(String(row.data)):{};
    if(skill==="writing"){const snapshot=b.snapshot as Record<string,unknown>;draft.writingDraft={task1:text(snapshot.task1,100000),task2:text(snapshot.task2,100000)};}
    else if(skill)draft[skill]=score(answers(b.snapshot),config(Number(row.test_id),skill));
    db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);
   }
   db().prepare("UPDATE attempt_progress SET lease_owner=NULL,lease_until=0 WHERE attempt_id=? AND lease_owner=?").run(id,String(b.tabId));return publicProgress(row);
  }
  if(b.action==="activate"){activateListening(row);return publicProgress(row);}
  if(b.action==="audio"){observeAudio(row,b.position,b.ended);return publicProgress(row);}
  if(b.action==="advance"){
   const skill=b.skill;if(skill!=="listening"&&skill!=="reading")reject(400,"Invalid section transition.");
   const prior=progress(row),stage=prior.stage;
   // Retrying the same completed transition is safe and cannot overwrite answers.
   if((skill==="listening"&&stage==="READING_ACTIVE")||(skill==="reading"&&stage==="WRITING_ACTIVE"))return publicProgress(row);
   const next=transition(row,skill),draft=row.data?JSON.parse(String(row.data)):{};
   // Final recovery snapshots are accepted atomically, including after a network outage.
   // Ordinary writes to a section are locked as soon as the candidate advances.
   draft[skill]=score(answers(b.answers),config(Number(row.test_id),skill));
   draft.sectionClocks??={};draft.sectionClocks[skill==="listening"?"reading":"writing"]=next.deadline;
   db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);
   return publicProgress(row);
  }
  reject(400,"Invalid lifecycle action.");
 });return reply(result);
});}
