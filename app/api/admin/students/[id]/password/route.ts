import {actor,body,endpoint,reject,reply,text} from "@/lib/results/http";
import {db,transaction} from "@/lib/results/db";import {passwordHash} from "@/lib/results/auth";import {audit} from "@/lib/results/store";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return endpoint(async()=>{
 const admin=await actor("admin"),b=await body(request),{id}=await params,password=text(b.password,128,true);if(password.length<12)reject(400,"Use at least 12 characters.");
 const hash=passwordHash(password);transaction(()=>{
 const row=db().prepare("SELECT id,registration_id FROM users WHERE id=? AND role='student'").get(id);if(!row)reject(404,"Candidate not found.");
 const active=db().prepare("SELECT a.id FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.student_id=? AND a.assignment_id IS NOT NULL AND a.submitted_at IS NULL AND p.stage!='NOT_STARTED' AND p.lease_until>?").get(id,Date.now());if(active)reject(409,"This candidate is taking a test. End or reassign it before changing the password.");
 db().prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash,id);db().prepare("DELETE FROM sessions WHERE user_id=?").run(id);db().prepare("DELETE FROM login_limits WHERE account=?").run(String(row.registration_id));audit(admin.id,"student.password-reset",id);
 });return reply({updated:true});
});}
