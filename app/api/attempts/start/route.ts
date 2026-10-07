import { candidatePayload, actor, body, endpoint, reply, testId } from "@/lib/results/http";
import { start } from "@/lib/results/store";
export async function POST(request: Request) {return endpoint(async()=>{const user=await actor("student",request),b=await body(request);candidatePayload(b);return reply(start(user,testId(b.testId)));});}
