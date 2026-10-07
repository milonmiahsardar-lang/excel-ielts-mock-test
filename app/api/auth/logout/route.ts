import { clearSession, currentUser } from "@/lib/results/auth";
import { body, endpoint, reject, reply } from "@/lib/results/http";
export async function POST(request: Request) {return endpoint(async()=>{
 const b=await body(request);
 if(b.admin!==true&&b.expectedCandidateId!==undefined){const user=await currentUser("student");if(user&&b.expectedCandidateId!==user.id)reject(401,"Another candidate is now logged in. Their session was not changed.");}
 await clearSession(b.admin===true?"admin":"student");return reply({ok:true});
});}
