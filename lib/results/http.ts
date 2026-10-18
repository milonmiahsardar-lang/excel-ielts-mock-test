import "server-only";
import { currentUser } from "./auth";
export class HttpError extends Error {constructor(public status: number,message: string){super(message);}}
export function reject(status: number,message: string): never {throw new HttpError(status,message);}
export async function actor(role?: "student"|"admin",request?: Request) {const user=await currentUser(role);if(!user)reject(401,"Please log in again. Your saved answers have been kept.");if(role&&user.role!==role)reject(403,"Access denied.");if(role==="student"&&request?.headers.get("x-ielts-candidate")&&request.headers.get("x-ielts-candidate")!==user.id)reject(401,"This browser tab belongs to a different candidate. Please reopen your assigned test after logging in.");return user;}
export async function body(request: Request): Promise<Record<string,unknown>> {
  const origin=request.headers.get("origin"),url=new URL(request.url);
  // Next.js can use localhost internally when the browser connects over the LAN.
  // Compare with the incoming Host, including its port, to retain same-origin protection.
  const host=request.headers.get("host") || url.host;
  let expectedOrigin: string;
  try {expectedOrigin=new URL(process.env.APP_ORIGIN||`${url.protocol}//${host}`).origin;}
  catch {reject(403,"Invalid request origin.");}
  if(!origin || origin!==expectedOrigin)reject(403,"Invalid request origin.");
  if(!request.headers.get("content-type")?.includes("application/json"))reject(415,"JSON required.");
  if(Number(request.headers.get("content-length") || 0)>250000)reject(413,"Submission is too large.");
  const reader=request.body?.getReader();if(!reader)reject(400,"Request body required.");
  const chunks: Uint8Array[]=[];let bytes=0;
  while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>250000){await reader.cancel();reject(413,"Submission is too large.");}chunks.push(chunk.value);}
  const text=Buffer.concat(chunks).toString("utf8");
  try{const value=JSON.parse(text);if(!value||Array.isArray(value)||typeof value!=="object")reject(400,"Invalid request.");return value;}catch(error){if(error instanceof HttpError)throw error;reject(400,"Invalid JSON.");}
}
export const reply=(value: unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
export async function endpoint(action: ()=>Promise<Response>): Promise<Response> {try{return await action();}catch(error){if(error instanceof HttpError)return reply({error:error.message},error.status);console.error("Results request failed",error);return reply({error:"Unable to save this request. Please retry. Your local answers have been kept."},500);}}
export function text(value: unknown,max: number,required=false) {if(typeof value!=="string"||value.length>max||value.includes("\0")||(required&&!value.trim()))reject(400,"Invalid or missing text field.");return value;}
export function testId(value: unknown) {if(typeof value!=="number"||!Number.isInteger(value)||value<1||value>20)reject(400,"Invalid mock test.");return value;}

export function candidatePayload(payload: Record<string,unknown>) {for(const field of ["candidateId","studentId","assignmentId","submissionId"]){if(field in payload)reject(400,"Candidate identity and assignment are determined by your login session.");}}
