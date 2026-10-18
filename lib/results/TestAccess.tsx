import Link from "next/link";
import { requirePage } from "./auth";
import { assignmentFor } from "./assignments";
import { HttpError } from "./http";
import { db } from "./db";
import { progress, progressPath, sectionFor } from "./lifecycle";
import { redirect } from "next/navigation";
export type TestQuery = { test?: string | string[] };
export async function accessError(query: TestQuery,section?:"listening"|"reading"|"writing"|"instructions"|"confirm") {
  const user=await requirePage("student");
  const value=query.test??"1";
  if(Array.isArray(value)||!/^([1-9]|1[0-9]|20)$/.test(value))return "Invalid mock test.";
  try {
   const assignment=assignmentFor(user,Number(value),false,true);
   if(section){
    const row=db().prepare("SELECT * FROM attempts WHERE assignment_id=? AND student_id=? AND submitted_at IS NULL").get(String(assignment.id),user.id);
    if(!row){assignmentFor(user,Number(value));if(section!=="confirm"&&section!=="instructions")redirect(`/confirm?test=${value}`);}
    else {const state=progress(row),active=sectionFor(state.stage);
     if(state.pending_section){if(section!=="instructions")redirect(progressPath(state,Number(value)));}
     else if(state.stage==="NOT_STARTED"){assignmentFor(user,Number(value));if(section!=="confirm"&&section!=="instructions")redirect(`/listening/instructions?test=${value}`);}
     else if(active!==section)redirect(progressPath(state,Number(value)));
    }
   }
   return null;
  }
  catch(error){if(error instanceof HttpError)return error.message;throw error;}
}
export function AccessDenied({message}:{message:string}) {return <main className="min-h-screen bg-[#f7f7f7] p-8 font-[Arial,sans-serif]"><section className="mx-auto max-w-xl border bg-white p-8"><h1 className="mb-4 text-2xl font-bold">Access Denied</h1><p>{message}</p><Link className="mt-6 inline-block text-[#075db5]" href="/candidate">Your assigned tests</Link></section></main>;}
