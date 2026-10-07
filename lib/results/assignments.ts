import "server-only";
import { db } from "./db";
import { reject } from "./http";
import type { User } from "./types";
export function assignmentFor(user: User,test: number,allowSubmitted=false) {
  if(user.role!=="student")reject(403,"Candidate access required.");
  const row=db().prepare("SELECT * FROM test_assignments WHERE candidate_id=? AND test_id=?").get(user.id,test);
  if(!row)reject(403,"This test has not been assigned to your account.");
  if(row.status==="REVOKED")reject(403,"This test assignment has been revoked.");
  if(row.expires_at && Date.parse(String(row.expires_at))<=Date.now())reject(403,"This test assignment has expired.");
  if(!allowSubmitted && (row.status==="SUBMITTED"||Number(row.attempts_used)>=Number(row.attempt_limit)))reject(403,"This test has already been submitted. Ask your administrator to reassign it.");
  return row;
}
export function authorizeAttempt(user: User,row: Record<string,unknown>,allowSubmitted=false) {
  if(row.student_id!==user.id)reject(404,"Attempt not found.");
  const assignment=assignmentFor(user,Number(row.test_id),allowSubmitted);
  if(!row.assignment_id||row.assignment_id!==assignment.id)reject(403,"This attempt is not attached to your current assignment.");
  return assignment;
}
export function ownAssignments(user: User) {
  return db().prepare("SELECT id,test_id,expires_at,status,attempts_used,attempt_limit,(SELECT p.stage FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.assignment_id=test_assignments.id AND a.submitted_at IS NULL LIMIT 1) active_stage,(SELECT data FROM attempts WHERE assignment_id=test_assignments.id AND submitted_at IS NULL LIMIT 1) active_draft,(SELECT id FROM attempts WHERE assignment_id=test_assignments.id AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1) submission_id FROM test_assignments WHERE candidate_id=? AND status!='REVOKED' AND (expires_at IS NULL OR expires_at>?) ORDER BY test_id").all(user.id,new Date().toISOString());
}

export function assignmentStatus(row: Record<string,unknown>) {return row.expires_at&&Date.parse(String(row.expires_at))<=Date.now()&&row.status!=="REVOKED"?"EXPIRED":String(row.status);}

export function resumePath(row:Record<string,unknown>) {
 const test=Number(row.test_id);let draft:Record<string,unknown>={};
 if(row.active_stage==="WRITING_ACTIVE")return `/test/writing?test=${test}`;
 if(String(row.active_stage).startsWith("READING"))return `/test?test=${test}`;
 if(String(row.active_stage).startsWith("LISTENING"))return `/listening?test=${test}&autoplay=true`;
 try{draft=row.active_draft?JSON.parse(String(row.active_draft)):{};}catch{}
 const clocks=draft.sectionClocks as Record<string,unknown>|undefined;
 if(draft.writingDraft||clocks?.writing)return `/test/writing?test=${test}`;
 if(draft.reading||clocks?.reading)return `/test?test=${test}`;
 return `/listening/instructions?test=${test}`;
}
