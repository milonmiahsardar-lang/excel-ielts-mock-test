import { randomUUID } from "node:crypto";
import { passwordHash } from "@/lib/results/auth";
import { db, transaction } from "@/lib/results/db";
import { actor, body, endpoint, reject, reply, text } from "@/lib/results/http";
import { audit } from "@/lib/results/store";
export async function POST(request: Request) {return endpoint(async()=>{const admin=await actor("admin"),b=await body(request),name=text(b.name,160,true).trim(),registrationId=text(b.registrationId,100,true).trim(),contact=text(b.contact??"",200),password=text(b.password,128,true);if(password.length<12)reject(400,"Use a password of at least 12 characters.");transaction(()=>{if(db().prepare("SELECT id FROM users WHERE registration_id=?").get(registrationId))reject(409,"Student ID already exists.");const id=randomUUID();db().prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(id,registrationId,name,contact,"student",passwordHash(password));audit(admin.id,"student.created",id);});return reply({created:true});});}
