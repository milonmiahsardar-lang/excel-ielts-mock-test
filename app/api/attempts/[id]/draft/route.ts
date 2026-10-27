import { actor, body, candidatePayload, endpoint, reject, reply, text } from "@/lib/results/http";
import { db, transaction } from "@/lib/results/db";
import { acceptDraftRevision, requireLease, requireSection } from "@/lib/results/lifecycle";
import { authorizeAttempt } from "@/lib/results/assignments";
type Context={params:Promise<{id:string}>};
function owned(id:string,user:Awaited<ReturnType<typeof actor>>) {const row=db().prepare("SELECT * FROM attempts WHERE id=? AND student_id=?").get(id,user.id);if(!row)reject(404,"Attempt not found.");authorizeAttempt(user,row);return row;}
export async function GET(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),row=owned((await params).id,user),draft=row.data?JSON.parse(String(row.data)):{};
 const raw=(skill:string)=>Object.fromEntries((draft[skill]?.questions??[]).map((q:{number:number;answer:string})=>[String(q.number),q.answer]));
 return reply({listening:raw('listening'),reading:raw('reading'),writing:draft.writingDraft??{task1:'',task2:''}});
},request);}
export async function PATCH(request:Request,{params}:Context){return endpoint(async()=>{
 const user=await actor("student",request),b=await body(request),{id}=await params;candidatePayload(b);
 const task1=text(b.task1,100000),task2=text(b.task2,100000);
 transaction(()=>{const row=owned(id,user);requireLease(row,request.headers.get("x-ielts-tab"));const state=requireSection(row,"writing");if(state.deadline&&Date.now()>state.deadline+5000)reject(409,"Writing time has finished. Please submit your saved response.");if(b.testId!==row.test_id)reject(400,"Wrong test.");const draft=row.data?JSON.parse(String(row.data)):{};if(!acceptDraftRevision(draft,"writing",b.revision))return;draft.writingDraft={task1,task2};db().prepare("UPDATE attempts SET data=? WHERE id=?").run(JSON.stringify(draft),id);});return reply({saved:true});
},request);}
