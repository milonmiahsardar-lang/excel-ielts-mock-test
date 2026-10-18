import { actor,body,endpoint,reply } from "@/lib/results/http";
import { createBackup,listBackups,backupStatus } from "@/lib/results/maintenance";
import { audit } from "@/lib/results/store";
export async function GET(){return endpoint(async()=>{await actor("admin");return reply({files:listBackups(),...backupStatus()});});}
export async function POST(request:Request){return endpoint(async()=>{const admin=await actor("admin");await body(request);const name=await createBackup();audit(admin.id,"backup.created",name);return reply({name});});}
