import LogoutButton from "@/app/components/LogoutButton";
import Link from "next/link";
import { requirePage } from "@/lib/results/auth";
import { ownAssignments } from "@/lib/results/assignments";
export default async function Candidate() {
 const user=await requirePage("student"),assignments=ownAssignments(user);
 return <main className="min-h-screen bg-[#f7f7f7] p-8 font-[Arial,sans-serif] text-[#252525]"><section className="mx-auto max-w-3xl"><nav className="mb-6 flex gap-6"><Link href="/">Homepage</Link><LogoutButton/></nav><h1 className="mb-4 text-2xl font-bold">Welcome, {user.name}</h1><h2 className="mb-6 text-xl">Your Assigned Tests</h2>{!assignments.length&&<p>No tests are currently assigned. Please contact your administrator.</p>}{assignments.map(a=><article className="mb-4 border bg-white p-6" key={String(a.id)}><h3 className="font-bold">Full Mock Test {String(a.test_id).padStart(2,"0")}</h3><p className="my-3">Status: {a.status==='SUBMITTED'?'Submitted':a.status==='IN_PROGRESS'?'In Progress':'Ready'}</p>{a.status==='SUBMITTED'&&!!a.submission_id&&<Link className="inline-block text-[#075db5] underline" href={`/test/writing/result?id=${a.submission_id}`}>View submission</Link>}{a.status!=='SUBMITTED'&&<Link className="inline-block bg-[#075db5] px-5 py-3 text-white" href={`/verify?test=${a.test_id}`}>{a.status==='IN_PROGRESS'?'Resume Test':'Start Test'}</Link>}</article>)}</section></main>;
}
