import { modeOf } from "@/lib/results/modes";
import { assignmentStatus } from "@/lib/results/assignments";
import { requirePage } from "@/lib/results/auth";
import { db } from "@/lib/results/db";
import AssignmentForm from "./AssignmentForm";
export default async function Assignments(){await requirePage("admin");const students=db().prepare("SELECT id,name,registration_id FROM users WHERE role='student' ORDER BY name").all();const rows=db().prepare("SELECT a.*,u.name,u.registration_id FROM test_assignments a JOIN users u ON u.id=a.candidate_id ORDER BY assigned_at DESC").all();return <section className="border bg-white p-6"><h1 className="mb-6 text-2xl font-bold">Test assignments</h1><AssignmentForm students={students.map(s=>({id:String(s.id),name:String(s.name),registrationId:String(s.registration_id)}))} rows={rows.map(a=>({purpose:a.purpose==="repeat"?"repeat":"fresh",mode:modeOf(a),id:String(a.id),candidateId:String(a.candidate_id),testId:Number(a.test_id),name:String(a.name),registrationId:String(a.registration_id),status:assignmentStatus(a),expiresAt:a.expires_at?String(a.expires_at):'',attemptsUsed:Number(a.attempts_used)}))}/></section>;}
