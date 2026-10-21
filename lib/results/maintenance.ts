import "server-only";
import { backup, DatabaseSync } from "node:sqlite";
import { mkdirSync,readdirSync,statSync,renameSync,unlinkSync } from "node:fs";
import { dirname,resolve,sep } from "node:path";
import { randomUUID } from "node:crypto";
import { db,databasePath } from "./db";
import { finalizeExpiredWriting } from "./store";
const state=globalThis as typeof globalThis&{ieltsMaintenance?:{timer?:ReturnType<typeof setInterval>;writingTimer?:ReturnType<typeof setInterval>;running?:Promise<string>;lastBackup?:string;error?:string}};
const current=state.ieltsMaintenance??={};
export const backupDirectory=()=>resolve(/*turbopackIgnore: true*/ process.env.BACKUP_DIR||resolve(dirname(databasePath()),"backups"));
export function listBackups(){const directory=backupDirectory();try{return readdirSync(/*turbopackIgnore: true*/ directory).filter(n=>/^results-[0-9TZ-]+-[a-f0-9-]+\.sqlite$/.test(n)).map(name=>({name,createdAt:statSync(resolve(directory,name)).mtime.toISOString(),bytes:statSync(resolve(directory,name)).size})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}catch{return [];}}
export function backupStatus(){return {lastBackup:current.lastBackup??listBackups()[0]?.createdAt??null,error:current.error??null};}
export async function createBackup(){
 if(current.running)return current.running;
 current.running=(async()=>{
  const directory=backupDirectory();if(directory===resolve("public")||directory.startsWith(resolve("public")+sep))throw new Error("Backups must be outside the public directory.");
  mkdirSync(directory,{recursive:true,mode:0o700});const name=`results-${new Date().toISOString().replace(/[:.]/g,"-")}-${randomUUID()}.sqlite`,target=resolve(directory,name),temporary=target+".partial";
  await backup(db(),temporary);const check=new DatabaseSync(temporary,{readOnly:true});try{if(check.prepare("PRAGMA integrity_check").get()?.integrity_check!=="ok")throw new Error("Backup integrity check failed.");}finally{check.close();}
  renameSync(temporary,target);current.lastBackup=new Date().toISOString();current.error=undefined;
  for(const old of listBackups().slice(28)){const file=resolve(directory,old.name);if(file.startsWith(directory+sep))unlinkSync(file);}
  return name;
 })().catch(e=>{current.error=e instanceof Error?e.message:"Backup failed";throw e;}).finally(()=>{current.running=undefined;});
 return current.running;
}
export function startMaintenance(){
 if(!current.writingTimer){
  const finalize=()=>{try{finalizeExpiredWriting();}catch(error){console.error("Writing deadline check failed",error);}};
  finalize();current.writingTimer=setInterval(finalize,5000);current.writingTimer.unref?.();
 }
 if(current.timer)return;
 const run=()=>{void createBackup().catch(e=>console.error("Automatic backup failed",e));};
 run();current.timer=setInterval(run,6*60*60*1000);current.timer.unref?.();
}
