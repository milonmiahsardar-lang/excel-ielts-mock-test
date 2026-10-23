import "server-only";
import { db } from "./db";
import { reject } from "./http";
import { includesModule, type TestMode, type TestSection } from "./modes";
import { purposeOf } from "./assessment-purpose";
export type ExposureSummary={skill:TestSection;status:"fresh"|"seen"|"uncertain";lastSeenAt:string|null;attempts:number};
export function exposureSummary(candidateId:string,test:number,mode:TestMode,excludeAttempt?:string):ExposureSummary[]{
 const rows=db().prepare("SELECT skill,certainty,first_seen_at FROM module_exposures WHERE candidate_id=? AND test_id=? AND attempt_id<>? ORDER BY first_seen_at DESC").all(candidateId,test,excludeAttempt??"");
 return (["listening","reading","writing"] as const).filter(skill=>includesModule(mode,skill)).map(skill=>{
  const history=rows.filter(row=>row.skill===skill);return {skill,status:history.some(row=>row.certainty==="seen")?"seen":history.length?"uncertain":"fresh",lastSeenAt:history.length?String(history[0].first_seen_at):null,attempts:history.length};
 });
}
export function requireFreshMaterial(candidateId:string,test:number,mode:TestMode,excludeAttempt?:string){
 const blocked=exposureSummary(candidateId,test,mode,excludeAttempt).filter(item=>item.status!=="fresh");
 if(blocked.length)reject(409,blocked.map(item=>`${item.skill[0].toUpperCase()+item.skill.slice(1)} Test ${test}: ${item.status==="seen"?"previously attempted":"History uncertain"}${item.lastSeenAt?` (${new Date(item.lastSeenAt).toLocaleDateString("en-GB",{timeZone:"Asia/Dhaka"})})`:""}`).join("; ")+". Choose different material for a fresh assessment, or explicitly select Repeat practice.");
}
// The lifecycle calls this within its transaction only after instruction and
// timing checks. Retried Start requests cannot add exposure or reset the clock.
export function recordModuleOpen(row:Record<string,unknown>,skill:TestSection){
 let purpose=purposeOf(row);
 const state=db().prepare("SELECT stage FROM attempt_progress WHERE attempt_id=?").get(String(row.id));
 if(purpose==="legacy"&&state?.stage==="NOT_STARTED"){
  const assignment=db().prepare("SELECT purpose FROM test_assignments WHERE id=?").get(String(row.assignment_id));
  purpose=assignment?.purpose==="repeat"?"repeat":"fresh";
  db().prepare("UPDATE attempts SET purpose=? WHERE id=?").run(purpose,String(row.id));row.purpose=purpose;
 }
 if(purpose==="fresh")requireFreshMaterial(String(row.student_id),Number(row.test_id),skill,String(row.id));
 db().prepare(`INSERT INTO module_exposures(attempt_id,candidate_id,test_id,skill,first_seen_at,certainty,source)
 VALUES(?,?,?,?,?,'seen','activation') ON CONFLICT(attempt_id,skill) DO UPDATE SET certainty='seen',source='activation'`)
 .run(String(row.id),String(row.student_id),Number(row.test_id),skill,new Date().toISOString());
}
