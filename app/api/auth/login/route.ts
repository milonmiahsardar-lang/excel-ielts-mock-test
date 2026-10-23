import { bootstrapAdmin, passwordHash, passwordMatches, setSession, userFromRow } from "@/lib/results/auth";
import { db } from "@/lib/results/db";
import { body, endpoint, reject, reply, text, testId } from "@/lib/results/http";
import { loginDestination } from "@/lib/results/assignment-login";
import { isTestMode } from "@/lib/results/modes";
export const runtime="nodejs";
const dummyHash=passwordHash("nonexistent-account-padding");
export async function POST(request: Request) {return endpoint(async()=>{
  const b=await body(request),username=text(b.username,100,true).trim(),password=text(b.password,128,true);bootstrapAdmin();
  const limit=db().prepare("SELECT * FROM login_limits WHERE account=?").get(username);
  if(limit&&Number(limit.reset_at)>Date.now()&&Number(limit.failures)>=10)reject(429,"Too many attempts. Please try again in 15 minutes.");
  const row=db().prepare("SELECT * FROM users WHERE registration_id=?").get(username);
  const valid=passwordMatches(password,row?String(row.password_hash):dummyHash);
  if(!row||!valid||(b.admin===true?row.role!=="admin":row.role!=="student")){
    db().prepare("INSERT INTO login_limits VALUES(?,1,?) ON CONFLICT(account) DO UPDATE SET failures=CASE WHEN reset_at<? THEN 1 ELSE failures+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END").run(username,Date.now()+900000,Date.now(),Date.now());reject(401,"Invalid username or password.");
  }
  db().prepare("DELETE FROM login_limits WHERE account=?").run(username);
  const user=userFromRow(row);let destination="/candidate";
  if(b.admin!==true&&b.testId!==undefined){
    const mode=b.mode??"full";if(!isTestMode(mode))reject(400,"Invalid test mode.");
    destination=loginDestination(user,testId(b.testId),mode);
  }
  await setSession(user);return reply({user,destination});
});}
