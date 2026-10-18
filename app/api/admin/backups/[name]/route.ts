import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { actor,endpoint,reject } from "@/lib/results/http";
import { backupDirectory,listBackups } from "@/lib/results/maintenance";
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){return endpoint(async()=>{await actor("admin");const {name}=await params;if(!listBackups().some(f=>f.name===name))reject(404,"Backup not found.");return new Response(readFileSync(resolve(backupDirectory(),name)),{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="${name}"`,"Cache-Control":"no-store"}});});}
