import { isTestMode } from "@/lib/results/modes";
import { randomUUID } from "node:crypto";
import { actor, body, endpoint, reject, reply, testId, text } from "@/lib/results/http";
import { db, transaction } from "@/lib/results/db";
import { audit } from "@/lib/results/store";
import { exposureSummary, requireFreshMaterial } from "@/lib/results/exposure";
export async function GET(request:Request){return endpoint(async()=>{
 await actor("admin");const query=new URL(request.url).searchParams,candidateId=text(query.get("candidateId"),80,true),test=testId(Number(query.get("testId"))),mode=query.get("mode")??"full";
 if(!isTestMode(mode))reject(400,"Invalid test mode.");
 if(!db().prepare("SELECT id FROM users WHERE id=? AND role='student'").get(candidateId))reject(404,"Candidate not found.");
 return reply({modules:exposureSummary(candidateId,test,mode)});
});}
export async function POST(request:Request){return endpoint(async()=>{
 const admin=await actor("admin"),b=await body(request),candidateId=text(b.candidateId,80,true),test=testId(b.testId);
 const mode=b.mode??"full";if(!isTestMode(mode))reject(400,"Invalid test mode.");
 const purpose=b.purpose??"fresh";if(purpose!=="fresh"&&purpose!=="repeat")reject(400,"Invalid assessment purpose.");
 const expires=text(b.expiresAt??"",80);let expiry:string|null=null;
 if(expires){if(!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now())reject(400,"Expiry must be a future date and time.");expiry=new Date(expires).toISOString();}
 const id=transaction(()=>{
  if(!db().prepare("SELECT id FROM users WHERE id=? AND role='student'").get(candidateId))reject(404,"Candidate not found.");
  if(purpose==="fresh")requireFreshMaterial(candidateId,test,mode);
  const existing=db().prepare("SELECT * FROM test_assignments WHERE candidate_id=? AND test_id=? AND mode=?").get(candidateId,test,mode);
  const id=existing?String(existing.id):randomUUID(),now=new Date().toISOString();
  const unfinished=existing&&db().prepare("SELECT p.stage FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.assignment_id=? AND a.submitted_at IS NULL").get(id);
  if(unfinished&&unfinished.stage!=="NOT_STARTED"&&b.confirmInterrupt!==true)reject(409,"This candidate has an unfinished test. Reassigning will end it. Confirm interruption to continue.");
  if(existing){db().prepare("UPDATE attempts SET assignment_id=NULL WHERE assignment_id=? AND submitted_at IS NULL").run(id);db().prepare("UPDATE test_assignments SET assigned_at=?,expires_at=?,status='ASSIGNED',attempts_used=0,purpose=? WHERE id=?").run(now,expiry,purpose,id);}
  else {
   db().prepare("INSERT INTO test_assignments(id,candidate_id,test_id,assigned_at,expires_at,status,mode,purpose) VALUES(?,?,?,?,?,'ASSIGNED',?,?)").run(id,candidateId,test,now,expiry,mode,purpose);
  }
  audit(admin.id,existing?"assignment.reset":"assignment.created",id);return id;
 });return reply({id});
});}
export async function PATCH(request:Request){return endpoint(async()=>{
 const admin=await actor("admin"),b=await body(request),id=text(b.assignmentId,80,true);
 transaction(()=>{if(!db().prepare("SELECT id FROM test_assignments WHERE id=?").get(id))reject(404,"Assignment not found.");const unfinished=db().prepare("SELECT p.stage FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.assignment_id=? AND a.submitted_at IS NULL").get(id);if(unfinished&&unfinished.stage!=="NOT_STARTED"&&b.confirmInterrupt!==true)reject(409,"This candidate has an unfinished test. Revoking will end access. Confirm interruption to continue.");db().prepare("UPDATE test_assignments SET status='REVOKED' WHERE id=?").run(id);audit(admin.id,"assignment.revoked",id);});return reply({revoked:true});
});}
