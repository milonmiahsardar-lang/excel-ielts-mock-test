import "server-only";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { User } from "./types";
export const tokenHash=(token: string)=>createHash("sha256").update(token).digest("hex");
export function passwordHash(password: string) {const salt=randomBytes(16).toString("hex");return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
export function passwordMatches(password: string,hash: string) {const [salt,key]=hash.split(":");if(!salt||!key)return false;const expected=Buffer.from(key,"hex"),actual=scryptSync(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export function bootstrapAdmin() {
  const username=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD;
  if(!username||!password||password.length<12)return;
  if(!db().prepare("SELECT id FROM users WHERE role='admin'").get())db().prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(randomUUID(),username,"Instructor","","admin",passwordHash(password));
}
export function userFromRow(row: Record<string,unknown>): User {return {id:String(row.id),name:String(row.name),registrationId:String(row.registration_id),contact:String(row.contact),role:row.role as User["role"]};}
type Role = User["role"];
const sessionCookie = (role: Role) => role === "admin" ? "ielts_admin_session" : "ielts_candidate_session";
function sessionUser(token?: string): User|null {
  if(!token)return null;
  const row=db().prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?").get(tokenHash(token),Date.now());
  return row?userFromRow(row):null;
}
export async function currentUser(role?: Role): Promise<User|null> {
  const store=await cookies();
  for(const requested of role?[role]:["student","admin"] as Role[]){
    // Accept existing sessions during rollout, but only for their actual role.
    const user=sessionUser(store.get(sessionCookie(requested))?.value);
    if(user?.role===requested)return user;
    const legacy=sessionUser(store.get("ielts_session")?.value);
    if(legacy?.role===requested)return legacy;
  }
  return null;
}
export async function requirePage(role?: Role) {
  const user=await currentUser(role);
  if(!user)redirect(role==="admin"?"/admin/login":"/verify");
  return user;
}
export async function clearSession(role: Role) {
  const store=await cookies(),name=sessionCookie(role),token=store.get(name)?.value;
  if(token)db().prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash(token));
  store.delete(name);
  const legacy=store.get("ielts_session")?.value;
  if(sessionUser(legacy)?.role===role){db().prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash(legacy!));store.delete("ielts_session");}
}
export async function setSession(user: User) {
  await clearSession(user.role);
  const store=await cookies(),token=randomBytes(32).toString("hex"),maxAge=12*60*60;
  db().prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
  db().prepare("INSERT INTO sessions VALUES(?,?,?)").run(tokenHash(token),user.id,Date.now()+maxAge*1000);
  store.set(sessionCookie(user.role),token,{httpOnly:true,secure:process.env.NODE_ENV==="production"&&process.env.CLASSROOM_HTTP!=="true",sameSite:"lax",path:"/",maxAge});
}
