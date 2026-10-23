import { candidatePayload, actor, body, endpoint, reply, testId } from "@/lib/results/http";
import { start } from "@/lib/results/store";
import { isTestMode } from "@/lib/results/modes";
import { reject } from "@/lib/results/http";
export async function POST(request: Request) {return endpoint(async()=>{const user=await actor("student",request),b=await body(request);candidatePayload(b);const mode=b.mode??"full";if(!isTestMode(mode))reject(400,"Invalid test mode.");return reply(start(user,testId(b.testId),request.headers.get("x-ielts-tab")??undefined,mode));});}
