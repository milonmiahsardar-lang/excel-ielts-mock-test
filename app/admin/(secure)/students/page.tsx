import Link from 'next/link';
import { requirePage } from '@/lib/results/auth';
import { db } from '@/lib/results/db';
import CreateStudent from './CreateStudent';
export default async function Students({searchParams}:{searchParams:Promise<{updated?:string}>}){
 await requirePage('admin');const query=await searchParams;
 const rows=db().prepare("SELECT u.id,u.name,u.registration_id,u.contact,GROUP_CONCAT(a.test_id, ', ') AS tests FROM users u LEFT JOIN test_assignments a ON a.candidate_id=u.id WHERE u.role='student' GROUP BY u.id ORDER BY u.name").all();
 return <><CreateStudent/><section className="mt-6 border bg-white p-6"><h2 className="mb-5 text-2xl font-bold">Candidates</h2>{query.updated==='1'&&<p role="status" className="mb-4">Candidate information updated successfully.</p>}<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Candidate name','Candidate ID','Email or phone','Test numbers','Actions'].map(t=><th key={t} className="border-b p-3">{t}</th>)}</tr></thead><tbody>{rows.map(u=><tr key={String(u.id)}><td className="p-3">{String(u.name)}</td><td className="p-3">{String(u.registration_id)}</td><td className="p-3">{String(u.contact)||'—'}</td><td className="p-3">{String(u.tests||'None')}</td><td className="p-3"><Link className="border px-3 py-1" href={"/admin/students/"+u.id+"/edit"}>Edit</Link></td></tr>)}</tbody></table></div>{!rows.length&&<p>No candidates found.</p>}</section></>;
}
