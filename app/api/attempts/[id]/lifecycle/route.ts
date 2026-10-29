import { saveAcknowledgement, type SavedSkill } from "@/lib/results/save-acknowledgement";
import { actor, body, candidatePayload, endpoint, reject, reply, text } from "@/lib/results/http";
import { db, transaction } from "@/lib/results/db";
import { authorizeAttempt } from "@/lib/results/assignments";
import { acceptDraftRevision, answerWindowOpen, acknowledgeCompletion, confirmInstructions, startSection, claimLease, observeAudio, progress, publicProgress, requireLease, sectionFor, transition } from "@/lib/results/lifecycle";
import { answers, config, completeSingleModule } from "@/lib/results/store";
import { modeOf } from "@/lib/results/modes";
import { score } from "@/lib/results/scoring";
type Context={params:Promise<{id:string}>};
function owned(id:string,userId:string){const row=db().prepare("SELECT * FROM attempts WHERE id=? AND student_id=?").get(id,userId);if(!row)reject(404,"Attempt not found.");return row;}
function savedProgress(row:Record<string,unknown>,skill:SavedSkill,incoming:unknown,revision:unknown,closed=false,accepted=false){
 const latest=db().prepare("SELECT data FROM attempts WHERE id=?").get(String(row.id))!;
 const draft=latest.data?JSON.parse(String(latest.data)):{};
 return {...publicProgress(row),saveAcknowledgement:saveAcknowledgement(draft,skill,incoming,revision,accepted,closed)};
}
export async function GET(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),row=owned((await params).id,user.id);authorizeAttempt(user,row,!!row.submitted_at);return reply(publicProgress(row));
},request);}
export async function POST(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),b=await body(request),{id}=await params;candidatePayload(b);
 const result=transaction(()=>{
  const row=owned(id,user.id);authorizeAttempt(user,row,!!row.submitted_at);
  if(b.testId!==row.test_id)reject(400,"Wrong test.");
  if(b.action==="release"){
   db().prepare("UPDATE attempt_progress SET lease_owner=NULL,lease_until=0 WHERE attempt_id=? AND lease_owner=?").run(id,typeof b.tabId==="string"?b.tabId:"");return publicProgress(row);
  }
  if(row.submitted_at){if(b.action==="advance"&&(b.skill==="reading"||b.skill==="listening"))return savedProgress(row,b.skill,b.answers,b.revision,true);if(b.action==="audio"&&b.ended===true)return savedProgress(row,"listening",b.answers,b.revision,true);return publicProgress(row);}
  if(b.action==="claim"){claimLease(row,b.tabId);return publicProgress(row);}
  requireLease(row,b.tabId);
  if(b.action==="suspend"){
   const state=progress(row),skill=state.pending_section?null:sectionFor(state.stage);
   if(b.skill===skill&&b.snapshot&&answerWindowOpen(state)&&state.stage!=="LISTENING_COMPLETED"){
    const draft=row.data?JSON.parse(String(row.data)):{};
    if(skill&&acceptDraftRevision(draft,skill,b.revision)){
    if(skill==="writing"){const snapshot=b.snapshot as Record<string,unknown>;draft.writingDraft={task1:text(snapshot.task1,100000),task2:text(snapshot.task2,100000)};}
    else if(skill)draft[skill]=score(answers(b.snapshot),config(Number(row.test_id),skill));
    db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);
    }
   }
   // pagehide also fires on refresh. Preserve ownership so the same tab can
   // reload safely; new documents without a reload identity still fail claimLease.
   // Do not invalidate a lease here: a delayed unload request can arrive after
   // the refreshed document has already renewed it.
   return publicProgress(row);
  }
  if(b.action==="confirm-instructions"){confirmInstructions(row,b.skill);return publicProgress(row);}
  if(b.action==="acknowledge-completion"){acknowledgeCompletion(row);return publicProgress(row);}
  if(b.action==="activate"){startSection(row,b.skill);return publicProgress(row);}
  if(b.action==="audio"){
   let acceptedAudio=false;
   const prior=progress(row),next=observeAudio(row,b.position,b.ended,b.playbackRate);
   if(prior.stage==="LISTENING_ACTIVE"&&next.stage==="LISTENING_COMPLETED"){
    const draft=row.data?JSON.parse(String(row.data)):{};
    if(acceptDraftRevision(draft,"listening",b.revision)){draft.listening=score(answers(b.answers),config(Number(row.test_id),"listening"));acceptedAudio=true;}
    db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);
   }
   if(modeOf(row)==="listening"&&next.stage==="LISTENING_COMPLETED")completeSingleModule(user,row);
   return b.ended===true?savedProgress(row,"listening",b.answers,b.revision,false,acceptedAudio):publicProgress(row);
  }
  if(b.action==="advance"){
   const skill=b.skill;if(skill!=="listening"&&skill!=="reading")reject(400,"Invalid section transition.");
   const prior=progress(row),stage=prior.stage;
   // Retrying the same completed transition is safe and cannot overwrite answers.
   if((skill==="listening"&&(prior.pending_section==="reading"||stage==="READING_ACTIVE"))||(skill==="reading"&&(prior.pending_section==="writing"||stage==="WRITING_ACTIVE")))return savedProgress(row,skill,b.answers,b.revision,true);
   const acceptFinal=answerWindowOpen(prior)&&!(skill==="listening"&&stage==="LISTENING_COMPLETED");
   const single=modeOf(row)!=="full";
   if(single){
    if(modeOf(row)!==skill)reject(403,"This module is not included in your assignment.");
    if(skill==="listening"&&stage!=="LISTENING_COMPLETED")reject(409,"Finish the recording before submitting.","TRANSITION_INVALID");
    if(skill==="reading"&&(!prior.deadline||prior.deadline>Date.now()||!["READING_ACTIVE","READING_COMPLETED"].includes(stage)))reject(409,"Reading submits when its time has finished.","TRANSITION_INVALID");
   }else transition(row,skill);
   const draft=row.data?JSON.parse(String(row.data)):{};
   // Late transitions retain the last server-saved answers. Revisions cannot
   // extend the deadline or overwrite a newer snapshot.
   const acceptedFinal=acceptFinal&&acceptDraftRevision(draft,skill,b.revision);if(acceptedFinal)draft[skill]=score(answers(b.answers),config(Number(row.test_id),skill));
   const finalAck=saveAcknowledgement(draft,skill,b.answers,b.revision,false,!acceptFinal);if(!acceptFinal&&!finalAck.matches&&(finalAck.requestedRevision??0)>(finalAck.committedRevision??0)){draft.saveNotices??={};draft.saveNotices[skill]=`Your ${skill} section retained its last accepted answers. Newer unconfirmed changes could not be included after the authorized save window closed.`;}
   db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);
   if(single)completeSingleModule(user,row);
   return savedProgress(row,skill,b.answers,b.revision,!acceptFinal,acceptedFinal);
  }
  reject(400,"Invalid lifecycle action.");
 });return reply(result);
},request);}
