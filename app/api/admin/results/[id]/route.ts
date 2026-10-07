import { actor, body, endpoint, reject, reply } from "@/lib/results/http";
import { getSubmission, mark } from "@/lib/results/store";
export async function GET(_request: Request,{params}: {params:Promise<{id:string}>}) {return endpoint(async()=>{await actor("admin");const s=getSubmission((await params).id);if(!s)reject(404,"Submission not found.");return reply(s);});}
export async function PATCH(request: Request,{params}: {params:Promise<{id:string}>}) {return endpoint(async()=>{const user=await actor("admin"),b=await body(request);return reply(mark(user,(await params).id,b));});}
