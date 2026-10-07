import { actor, body, endpoint, reply } from "@/lib/results/http";
import { updateCandidate } from "@/lib/results/candidates";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return endpoint(async()=>{const admin=await actor('admin');const {id}=await params;return reply(updateCandidate(admin.id,id,await body(request)));});}
