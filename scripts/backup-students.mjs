import {backup} from 'node:sqlite';import {mkdirSync} from 'node:fs';import {resolve,dirname,sep} from 'node:path';import {randomUUID} from 'node:crypto';import {openStudents} from './student-storage.mjs';
const database=openStudents(true),source=database.location(),directory=resolve(process.env.STUDENT_BACKUP_DIR||resolve(dirname(source),'student-backups'));
if(directory===resolve('public')||directory.startsWith(resolve('public')+sep))throw Error('Backups must be private.');mkdirSync(directory,{recursive:true,mode:0o700});
try{const file=resolve(directory,'students-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID()+'.sqlite');await backup(database,file);console.log('Student backup created:',file);}finally{database.close();}
