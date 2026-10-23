import "server-only";
import { db, transaction } from "./db";
import { reject, text, testId } from "./http";
import { requireFreshMaterial } from "./exposure";
import { purposeOf, type AssessmentPurpose } from "./assessment-purpose";
import { audit } from "./store";
import { modeOf, type TestMode } from "./modes";
export type CandidateEdit={id:string;name:string;registrationId:string;contact:string;assignments:{id:string;testId:number;mode:TestMode;purpose:AssessmentPurpose;status:string;editable:boolean}[]};
export function candidate(id:string):CandidateEdit|null {
 const u=db().prepare("SELECT id,name,registration_id,contact FROM users WHERE id=? AND role='student'").get(id);if(!u)return null;
 const assignments=db().prepare("SELECT a.*,EXISTS(SELECT 1 FROM attempts t WHERE t.assignment_id=a.id) AS has_attempt FROM test_assignments a WHERE candidate_id=? ORDER BY test_id").all(id);
 return {id:String(u.id),name:String(u.name),registrationId:String(u.registration_id),contact:String(u.contact),assignments:assignments.map(a=>({id:String(a.id),testId:Number(a.test_id),mode:modeOf(a),purpose:purposeOf(a),status:String(a.status),editable:a.status==='ASSIGNED'&&Number(a.attempts_used)===0&&!a.has_attempt}))};
}
function field(value:unknown,max:number,label:string,required=true){if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value)||(required&&!value.trim()))reject(400,'Please enter a valid '+label+'.');return value.trim();}
export function updateCandidate(adminId:string,id:string,b:Record<string,unknown>){
 const name=field(b.name,160,'candidate name'),registrationId=field(b.registrationId,100,'Candidate ID'),contact=field(b.contact,200,'email or phone',false);
 if(!Array.isArray(b.assignments)||b.assignments.length>80)reject(400,'Invalid test assignments.');
 const changes=b.assignments.map(value=>{if(!value||typeof value!=='object'||Array.isArray(value))reject(400,'Invalid test assignment.');const a=value as Record<string,unknown>;return {id:text(a.id,80,true),testId:testId(a.testId),originalTestId:testId(a.originalTestId)};});
 if(new Set(changes.map(a=>a.id)).size!==changes.length)reject(400,'Duplicate test assignment.');
 return transaction(()=>{
  const current=candidate(id);if(!current)reject(404,'Candidate not found.');
  const original=b.original;if(!original||typeof original!=='object'||Array.isArray(original))reject(400,'Please reload the candidate before saving.');
  const snapshot=original as Record<string,unknown>;
  if(snapshot.name!==current.name||snapshot.registrationId!==current.registrationId||snapshot.contact!==current.contact)reject(409,'Candidate information has changed. Reload this page before saving.');
  if(db().prepare('SELECT id FROM users WHERE registration_id=? AND id<>?').get(registrationId,id))reject(409,'Candidate ID already exists. Choose a unique ID.');
  for(const change of changes){
   const a=current.assignments.find(a=>a.id===change.id);if(!a)reject(400,'This assignment does not belong to this candidate.');
   if(a.testId!==change.originalTestId)reject(409,'The assignment has changed. Reload this page before saving.');
   if(a.testId===change.testId)continue;
   if(!a.editable)reject(409,'This test has already started, was submitted, or is revoked. Its test number cannot be changed. Existing answers and results are protected.');
   if(a.purpose==='fresh')requireFreshMaterial(id,change.testId,a.mode);
   if(current.assignments.some(other=>other.id!==a.id&&other.mode===a.mode&&other.testId===change.testId)||changes.some(other=>other.id!==a.id&&current.assignments.find(original=>original.id===other.id)?.mode===a.mode&&other.testId===change.testId))reject(409,'This candidate already has an assignment for that test and mode. Choose another test.');
  }
  const basicChanged=name!==current.name||registrationId!==current.registrationId||contact!==current.contact;
  if(basicChanged)db().prepare("UPDATE users SET name=?,registration_id=?,contact=? WHERE id=? AND role='student'").run(name,registrationId,contact,id);
  let assignmentChanged=false;
  for(const change of changes){if(change.testId===change.originalTestId)continue;db().prepare('UPDATE test_assignments SET test_id=? WHERE id=? AND candidate_id=?').run(change.testId,change.id,id);audit(adminId,'assignment.corrected',change.id);assignmentChanged=true;}
  if(basicChanged||assignmentChanged)audit(adminId,'student.updated',id);
  return {updated:true};
 });
}
