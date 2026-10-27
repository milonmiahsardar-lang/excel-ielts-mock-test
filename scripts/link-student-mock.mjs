import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {openStudents} from './student-storage.mjs';
// Deliberate operator action only. Never infer ownership from an email/name match.
const [email,candidateId,operator,confirm]=process.argv.slice(2);
if(!email||!candidateId||!operator||confirm!=='--confirm-link')throw Error('Usage: node scripts/link-student-mock.mjs <student-email> <candidate-id> <operator-name> --confirm-link');
const student=openStudents(),mock=new DatabaseSync(resolve(process.env.RESULTS_DB_PATH||'private/results.sqlite'),{readOnly:true});
try{const row=student.prepare('SELECT id FROM students WHERE email=?').get(email.trim().toLowerCase());if(!row)throw Error('Student account not found.');if(!mock.prepare("SELECT 1 FROM users WHERE id=? AND role='student'").get(candidateId))throw Error('Candidate account not found.');student.prepare('INSERT INTO mock_links VALUES(?,?,?,?)').run(String(row.id),candidateId,new Date().toISOString(),operator);console.log('Read-only mock-history link created. Candidate credentials, assignments and results were not changed.');}finally{student.close();mock.close();}
