import "server-only";
import { db } from "./db";
import { reject } from "./http";
import type { User } from "./types";
import { modeOf, modePath, type TestMode } from "./modes";
export function assignmentFor(user: User,test: number,allowSubmitted=false,allowExpired=false,mode:TestMode="full") {
  if(user.role!=="student")reject(403,"Candidate access required.");
  const row=db().prepare("SELECT * FROM test_assignments WHERE candidate_id=? AND test_id=? AND mode=?").get(user.id,test,mode);
  if(!row)reject(403,"This test has not been assigned to your account.");
  if(row.status==="REVOKED")reject(403,"This test assignment has been revoked.");
  if(!allowExpired && row.expires_at && Date.parse(String(row.expires_at))<=Date.now())reject(403,"This test assignment has expired.");
  if(!allowSubmitted && (row.status==="SUBMITTED"||Number(row.attempts_used)>=Number(row.attempt_limit)))reject(403,"This test has already been submitted. Ask your administrator to reassign it.");
  return row;
}
export function authorizeAttempt(user: User,row: Record<string,unknown>,allowSubmitted=false) {
  if(row.student_id!==user.id)reject(404,"Attempt not found.");
  // Ownership of a completed result is independent of today's assignment.
  if(allowSubmitted&&row.submitted_at)return db().prepare("SELECT * FROM test_assignments WHERE id=?").get(String(row.assignment_id))??{id:row.assignment_id};
  const stage=db().prepare("SELECT stage FROM attempt_progress WHERE attempt_id=?").get(String(row.id));
  const started=!!stage&&stage.stage!=="NOT_STARTED";
  const assignment=assignmentFor(user,Number(row.test_id),allowSubmitted,started,modeOf(row));
  if(!row.assignment_id||row.assignment_id!==assignment.id)reject(403,"This attempt is not attached to your current assignment.");
  return assignment;
}
export function ownAssignments(user: User) {
  return db().prepare("SELECT id,test_id,mode,purpose,expires_at,status,attempts_used,attempt_limit,(SELECT p.stage FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.assignment_id=test_assignments.id AND a.submitted_at IS NULL LIMIT 1) active_stage,(SELECT data FROM attempts WHERE assignment_id=test_assignments.id AND submitted_at IS NULL LIMIT 1) active_draft,(SELECT id FROM attempts WHERE assignment_id=test_assignments.id AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1) submission_id FROM test_assignments WHERE candidate_id=? AND status!='REVOKED' AND (expires_at IS NULL OR expires_at>?) ORDER BY test_id,mode").all(user.id,new Date().toISOString());
}

export function assignmentStatus(row: Record<string,unknown>) {return row.expires_at&&Date.parse(String(row.expires_at))<=Date.now()&&row.status!=="REVOKED"?"EXPIRED":String(row.status);}

export function resumePath(row:Record<string,unknown>) {
 const mode=modeOf(row),test=Number(row.test_id);const target=(p:string)=>modePath(p,mode);let draft:Record<string,unknown>={};
 if(row.active_stage==="WRITING_ACTIVE")return target(`/test/writing?test=${test}`);
 if(String(row.active_stage).startsWith("READING"))return target(`/test?test=${test}`);
 if(String(row.active_stage).startsWith("LISTENING"))return target(`/listening?test=${test}&autoplay=true`);
 try{draft=row.active_draft?JSON.parse(String(row.active_draft)):{};}catch{}
 const clocks=draft.sectionClocks as Record<string,unknown>|undefined;
 if(draft.writingDraft||clocks?.writing)return target(`/test/writing?test=${test}`);
 if(draft.reading||clocks?.reading)return target(`/test?test=${test}`);
 return target(`/listening/instructions?test=${test}`);
}
