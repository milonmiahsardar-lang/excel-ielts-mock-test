"use client";
import { testModes, modeLabel, type TestMode } from "@/lib/results/modes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request, RequestError } from "@/lib/results/client";
import type { ExposureSummary } from "@/lib/results/exposure";
import { purposeLabel } from "@/lib/results/assessment-purpose";
type Student={id:string;name:string;registrationId:string};
type Row={purpose:"fresh"|"repeat";mode:TestMode;id:string;candidateId:string;testId:number;name:string;registrationId:string;status:string;expiresAt:string;attemptsUsed:number};
export default function AssignmentForm({students,rows}:{students:Student[];rows:Row[]}){
 const assign=async(payload:Record<string,unknown>,method="POST")=>{try{return await request('/api/admin/assignments',payload,method);}catch(e){if(e instanceof RequestError&&e.status===409&&e.message.includes('Confirm interruption')&&window.confirm(e.message))return request('/api/admin/assignments',{...payload,confirmInterrupt:true},method);throw e;}};
 const router=useRouter(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [candidateId,setCandidateId]=useState(''),[test,setTest]=useState(1),[mode,setMode]=useState<TestMode>('full'),[purpose,setPurpose]=useState<'fresh'|'repeat'>('fresh');
 const [history,setHistory]=useState<ExposureSummary[]|null>(null),[historyError,setHistoryError]=useState('');
 const [historyRevision,setHistoryRevision]=useState(0);
 useEffect(()=>{let current=true;setHistory(null);setHistoryError('');if(!candidateId)return;
  void request<{modules:ExposureSummary[]}>(`/api/admin/assignments?${new URLSearchParams({candidateId,testId:String(test),mode})}`,undefined,'GET').then(value=>{if(current)setHistory(value.modules);}).catch(error=>{if(current)setHistoryError((error as Error).message);});
  return()=>{current=false;};
 },[candidateId,test,mode,historyRevision]);
 const blocked=purpose==='fresh'&&(!history||history.some(module=>module.status!=='fresh'));
 return <><form className="mb-8 max-w-xl space-y-4" onSubmit={async e=>{e.preventDefault();if(blocked)return;const data=new FormData(e.currentTarget);setBusy(true);setMessage('');try{const expiry=String(data.get('expiresAt')||'');await assign({candidateId,testId:test,mode,purpose,expiresAt:expiry?new Date(expiry).toISOString():''});setMessage(`${purposeLabel(purpose)} assigned. Previous completed results are kept.`);setHistoryRevision(value=>value+1);router.refresh();}catch(e){setMessage((e as Error).message);setHistoryRevision(value=>value+1);}finally{setBusy(false);}}}>
 <label className="block">Candidate<select required name="candidateId" value={candidateId} onChange={e=>setCandidateId(e.target.value)} className="mt-1 block w-full border p-2"><option value="">Select candidate</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.registrationId})</option>)}</select></label>
 <label className="block">Test<select name="testId" value={test} onChange={e=>setTest(Number(e.target.value))} className="mt-1 block w-full border p-2">{Array.from({length:20},(_,i)=><option key={i+1} value={i+1}>Mock Test {String(i+1).padStart(2,'0')}</option>)}</select></label>
 <label className="block">Test mode<select name="mode" value={mode} onChange={e=>setMode(e.target.value as TestMode)} className="mt-1 block w-full border p-2">{testModes.map(mode=><option key={mode} value={mode}>{modeLabel(mode)}</option>)}</select></label>
 <label className="block">Assessment purpose<select name="purpose" value={purpose} onChange={e=>setPurpose(e.target.value as 'fresh'|'repeat')} className="mt-1 block w-full border p-2"><option value="fresh">Fresh assessment</option><option value="repeat">Repeat practice</option></select></label>
 {candidateId&&<section className="space-y-2 border p-3" aria-label="Previous module exposure"><h2 className="font-bold">Candidate history for Test {test}</h2>{historyError?<p role="alert">{historyError}</p>:history?history.map(module=><p key={module.skill} className="capitalize">{module.skill}: <strong>{module.status==='seen'?'Previously attempted':module.status==='uncertain'?'History uncertain':'No previous exposure recorded'}</strong>{module.lastSeenAt&&<span> · Attempt date: {new Date(module.lastSeenAt).toLocaleDateString('en-GB',{timeZone:'Asia/Dhaka'})}</span>}</p>):<p role="status">Checking history…</p>}{history?.some(module=>module.status!=='fresh')&&<p>Choose different material for a fresh assessment, or select Repeat practice deliberately.</p>}{purpose==='repeat'&&<p>This assignment and its new result will be labelled Repeat practice.</p>}</section>}
 <label className="block">Expiry (optional, your local time)<input type="datetime-local" name="expiresAt" className="mt-1 block w-full border p-2"/></label>
 <p>Previously opened modules require Repeat practice. Previous completed results are kept.</p>
 <button disabled={busy||!candidateId||blocked} className="bg-[#8b2635] px-5 py-2 text-white disabled:opacity-50">Assign test</button><p role="status">{message}</p></form>
 <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Candidate','Test','Mode','Purpose','Status','Attempts used','Expiry',''].map(x=><th className="border-b p-3" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(a=><tr key={a.id}><td className="p-3">{a.name} ({a.registrationId})</td><td className="p-3">{a.testId}</td><td className="p-3">{modeLabel(a.mode)}</td><td className="p-3">{purposeLabel(a.purpose)}</td><td className="p-3">{{ASSIGNED:'Not Started',IN_PROGRESS:'In Progress',SUBMITTED:'Submitted',REVOKED:'Revoked',EXPIRED:'Expired'}[a.status]||a.status}</td><td className="p-3">{a.attemptsUsed}/1</td><td className="p-3">{a.expiresAt?new Date(a.expiresAt).toLocaleString():'None'}</td><td className="p-3"><Link className="mr-2 border px-3 py-1" href={`/admin/students/${a.candidateId}/edit`}>Edit</Link><button disabled={busy||a.status==='REVOKED'} className="border px-3 py-1" onClick={async()=>{setBusy(true);try{await assign({assignmentId:a.id},'PATCH');setMessage('Assignment revoked.');router.refresh();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>Revoke</button></td></tr>)}</tbody></table></div></>;
}
