"use client";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {ensureAttempt} from "@/lib/results/client";
import {lifecycle,requestTestFullscreen,useAttemptStatus} from "@/lib/results/safety-client";

type Skill="listening"|"reading"|"writing";
const sections:{skill:Skill;title:string;timing:string;instructions:string[]}[]=[
 {skill:"listening",title:"Listening",timing:"Approximately 30 minutes — recording length",instructions:["Check your headphones and tell a staff member if you cannot hear clearly.","There are 40 questions. Follow each question’s word limit.","Listen and enter your answers as the recording plays. It begins when you select Start Listening.","Keep this test open in the same tab. Your answers are saved as you work."]},
 {skill:"reading",title:"Reading",timing:"60 minutes",instructions:["Read all three passages and answer Questions 1–40.","Follow each question’s instructions and word limit.","You may move between passages during the Reading section.","You have 60 minutes, including time to check answers. The timer begins when you select Start Reading."]},
 {skill:"writing",title:"Writing",timing:"60 minutes",instructions:["Complete both Writing tasks.","Spend about 20 minutes on Task 1 and write at least 150 words.","Spend about 40 minutes on Task 2 and write at least 250 words.","The 60-minute timer begins when you select Start Writing. Submit when finished; your responses will be saved for instructor marking."]}
];
export default function SectionDashboard({videos}:{videos:Record<Skill,boolean>}){
 const query=useSearchParams(),router=useRouter(),status=useAttemptStatus(),test=query.get("test")||"1";
 const state=status?.testId===Number(test)?status:null;
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[expanded,setExpanded]=useState(false);
 const [failedVideos,setFailedVideos]=useState<Partial<Record<Skill,boolean>>>({});
 const current:Skill=state?.pendingSection||"listening";
 const index=sections.findIndex(s=>s.skill===current);
 const ended=!!state?.pendingSection&&!state.completionAcknowledged;
 useEffect(()=>{setExpanded(false);},[current]);
 useEffect(()=>{let live=true;void ensureAttempt(test).catch(e=>{if(live)setError((e as Error).message);});return()=>{live=false;};},[test]);
 const action=async(kind:string)=>{
  if(busy)return;setBusy(true);setError("");
  try{
   const fullscreen=kind==="activate"?requestTestFullscreen():Promise.resolve();
   const [attempt]=await Promise.all([ensureAttempt(test),fullscreen]);
   const next=await lifecycle(attempt.id,test,kind,{skill:current});
   if(kind==="activate")router.replace(next.path);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 return <main className="min-h-screen bg-[#f7f7f7] font-[Arial,sans-serif] text-[#252525]">
  <header className="border-b border-[#dedede] bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5"><div className="flex items-center gap-4"><img src="/images/excel-institute-logo.jpg" alt="Excel Institute" className="h-10 w-[108px] object-contain"/><span className="font-semibold">IELTS Mock Test</span></div><span>Test {test}</span></div></header>
  {!state?<div className="p-12 text-center" role="status">Loading your test…</div>:ended?<section className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6"><div className="w-full rounded border border-[#dedede] bg-white p-8"><h1 className="text-2xl font-semibold">{sections[index-1].title} section ended</h1><p className="mt-5">All your saved answers for this section have been stored.</p><p className="mt-3">Select Continue to review the {sections[index].title} instructions.</p>{error&&<p className="mt-4 text-red-700" role="alert">{error}</p>}<button disabled={busy} onClick={()=>void action("acknowledge-completion")} className="mt-6 rounded-sm bg-black px-8 py-3 text-white disabled:opacity-50">{busy?"Please wait…":"Continue"}</button></div></section>:<section className="mx-auto max-w-5xl space-y-6 px-6 py-10"><h1 className="text-2xl font-semibold">Your test sections</h1>{sections.map((section,i)=>{
   const completed=i<index,available=i===index;
   return <article key={section.skill} className="rounded border border-[#c9c9c9] bg-white p-6 sm:p-8"><div className="flex justify-between"><h2 className="text-xl font-semibold">{section.title}</h2>{completed&&<span className="text-3xl font-bold text-green-700" aria-label="Completed">✓</span>}</div><p className={`mt-3 font-semibold ${completed?"text-green-700":"text-[#c51f34]"}`}>{completed?"Completed":"Not completed"}</p><p className="mt-4 text-sm">Timing: {section.timing}</p>{available?<><div className="mt-5 rounded border border-[#c9c9c9] bg-[#fafafa]"><button type="button" aria-expanded={expanded} aria-controls={`instructions-${section.skill}`} onClick={()=>setExpanded(v=>!v)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left"><span aria-hidden="true">{expanded?"▴":"▾"}</span><span>Test information</span><span className={state.instructionsConfirmed?"text-green-700":"text-[#c51f34]"}>{state.instructionsConfirmed?"Confirmed":"Not confirmed"}</span></button>{expanded&&<div id={`instructions-${section.skill}`} className="space-y-5 px-5 pb-5">{videos[section.skill]&&!failedVideos[section.skill]&&<video key={section.skill} controls preload="metadata" aria-label={`${section.title} instruction video`} className="max-h-[420px] w-full bg-black" src={`/videos/${section.skill}-instructions.mp4`} onError={()=>setFailedVideos(v=>({...v,[section.skill]:true}))}/>}{!state.instructionsConfirmed&&<div className="border-t pt-5"><h3 className="font-semibold">Ready?</h3><p className="mt-2">Please confirm that you have understood the video instructions.</p><button disabled={busy} onClick={()=>void action("confirm-instructions")} className="mt-4 rounded-sm bg-black px-5 py-2 text-white disabled:opacity-50">{busy?"Please wait…":"✓ I confirm"}</button></div>}</div>}</div>{state.instructionsConfirmed&&<button disabled={busy} onClick={()=>void action("activate")} className="mt-5 rounded-sm bg-[#c51f34] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy?"Starting…":`Start ${section.title} →`}</button>}{error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}</>:!completed&&<p className="mt-4 text-sm text-[#666]">Available after the previous section is completed.</p>}</article>;
  })}</section>}
  <footer className="border-t bg-white p-5 text-center text-sm text-[#666]">Excel Institute · IELTS Mock Tests · Sylhet</footer>
 </main>;
}
