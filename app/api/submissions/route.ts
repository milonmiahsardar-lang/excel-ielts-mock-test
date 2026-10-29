import { candidatePayload, actor, body, endpoint, reply } from "@/lib/results/http";
import { submit } from "@/lib/results/store";
export async function POST(request: Request) {return endpoint(async()=>{const user=await actor("student",request),b=await body(request);candidatePayload(b);const s=submit(user,b,request.headers.get("x-ielts-tab"));return reply({id:s.id,testName:s.testName,studentName:s.student.name,submittedAt:s.submittedAt,saveAcknowledgement:s.saveAcknowledgement});},request);}
