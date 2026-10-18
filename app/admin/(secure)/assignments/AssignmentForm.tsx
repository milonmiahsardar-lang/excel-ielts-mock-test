"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { request, RequestError } from "@/lib/results/client";
type Student={id:string;name:string;registrationId:string};
type Row={id:string;candidateId:string;testId:number;name:string;registrationId:string;status:string;expiresAt:string;attemptsUsed:number};
export default function AssignmentForm({students,rows}:{students:Student[];rows:Row[]}){
 const assign=async(payload:Record<string,unknown>,method="POST")=>{try{return await request('/api/admin/assignments',payload,method);}catch(e){if(e instanceof RequestError&&e.status===409&&e.message.includes('Confirm interruption')&&window.confirm(e.message))return request('/api/admin/assignments',{...payload,confirmInterrupt:true},method);throw e;}};
 const router=useRouter(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 return <><form className="mb-8 max-w-xl space-y-4" onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);setMessage('');try{const expiry=String(data.get('expiresAt')||'');await assign({candidateId:data.get('candidateId'),testId:Number(data.get('testId')),expiresAt:expiry?new Date(expiry).toISOString():''});setMessage('Test assigned. The candidate can start a fresh attempt.');router.refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>
 <label className="block">Candidate<select required name="candidateId" className="mt-1 block w-full border p-2"><option value="">Select candidate</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.registrationId})</option>)}</select></label>
 <label className="block">Test<select name="testId" className="mt-1 block w-full border p-2">{Array.from({length:20},(_,i)=><option key={i+1} value={i+1}>Full Mock Test {String(i+1).padStart(2,'0')}</option>)}</select></label>
 <label className="block">Expiry (optional, your local time)<input type="datetime-local" name="expiresAt" className="mt-1 block w-full border p-2"/></label>
 <p>Assigning a test again starts a fresh attempt. Previous completed results are kept.</p>
 <button disabled={busy} className="bg-[#8b2635] px-5 py-2 text-white">Assign test</button><p role="status">{message}</p></form>
 <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Candidate','Test','Status','Attempts used','Expiry',''].map(x=><th className="border-b p-3" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(a=><tr key={a.id}><td className="p-3">{a.name} ({a.registrationId})</td><td className="p-3">{a.testId}</td><td className="p-3">{{ASSIGNED:'Not Started',IN_PROGRESS:'In Progress',SUBMITTED:'Submitted',REVOKED:'Revoked',EXPIRED:'Expired'}[a.status]||a.status}</td><td className="p-3">{a.attemptsUsed}/1</td><td className="p-3">{a.expiresAt?new Date(a.expiresAt).toLocaleString():'None'}</td><td className="p-3"><Link className="mr-2 border px-3 py-1" href={`/admin/students/${a.candidateId}/edit`}>Edit</Link><button disabled={busy||a.status==='REVOKED'} className="border px-3 py-1" onClick={async()=>{setBusy(true);try{await assign({assignmentId:a.id},'PATCH');setMessage('Assignment revoked.');router.refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>Revoke</button></td></tr>)}</tbody></table></div></>;
}
