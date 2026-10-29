import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import {createHash} from 'node:crypto';
import { categories, slugify } from './catalog';
let connection: DatabaseSync | undefined;
export function studentDatabasePath() { return resolve(/*turbopackIgnore: true*/ process.env.STUDENT_DB_PATH || resolve(dirname(process.env.RESULTS_DB_PATH || 'private/results.sqlite'), 'students.sqlite')); }
export function studentDb() {
    if (connection)
        return connection;
    const target = studentDatabasePath(), publicDir = resolve('public');
    if (target === publicDir || target.startsWith(publicDir + sep) || target === resolve(/*turbopackIgnore: true*/ process.env.RESULTS_DB_PATH || 'private/results.sqlite'))
        throw Error('Student database must be private and separate from mock results.');
    if (process.env.RAILWAY_ENVIRONMENT_NAME) {
        const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
        if (!mount || !target.startsWith(resolve(mount) + sep))
            throw Error('Student database requires persistent storage on Railway.');
    }
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    const database = new DatabaseSync(target);
    database.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS student_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
    if (!database.prepare('SELECT 1 FROM student_migrations WHERE version=1').get()) {
        database.exec('BEGIN IMMEDIATE');
        try {
            database.exec(readFileSync(resolve('lib/student/migration.sql'), 'utf8'));
            for (const category of categories) {
                database.prepare('INSERT INTO categories VALUES(?,?)').run(category.slug, category.name);
                for (const topic of category.topics)
                    database.prepare('INSERT INTO topics VALUES(?,?,?,?)').run(category.slug + ':' + slugify(topic), category.slug, slugify(topic), topic);
            }
            database.prepare('INSERT INTO student_migrations VALUES(1,?)').run(new Date().toISOString());
            database.exec('COMMIT');
        }
        catch (e) {
            database.exec('ROLLBACK');
            database.close();
            throw e;
        }
    }
    if(!database.prepare('SELECT 1 FROM student_migrations WHERE version=2').get()){
      database.exec('BEGIN IMMEDIATE');try{database.exec(readFileSync(resolve('lib/student/migration-2.sql'),'utf8'));
      categories.forEach((c,index)=>database.prepare('UPDATE categories SET description=?,position=? WHERE id=?').run(c.description,index,c.slug));
      database.prepare('INSERT INTO student_migrations VALUES(2,?)').run(new Date().toISOString());database.exec('COMMIT');}catch(error){database.exec('ROLLBACK');database.close();throw error;}
    }
    if(!database.prepare('SELECT 1 FROM student_migrations WHERE version=3').get()){
      database.exec('BEGIN IMMEDIATE');try{
        const now=new Date().toISOString();
        for(const row of database.prepare('SELECT q.*,l.topic_id,l.published,t.category_id FROM questions q JOIN lessons l ON l.id=q.lesson_id JOIN topics t ON t.id=l.topic_id LEFT JOIN practice_set_questions ps ON ps.set_id=q.lesson_id AND ps.position=q.position WHERE ps.question_id IS NULL').all()){
          const id='legacy-'+createHash('sha256').update(String(row.lesson_id)+':'+row.id).digest('hex').slice(0,40),content=JSON.parse(String(row.content)),key=JSON.parse(String(row.key_json)),status=row.published?'published':'draft',title=String(content.prompt||row.id).slice(0,200),marks=Number(content.marks)||1;
          const data={...content,...key,id,title,legacy:true,categoryId:String(row.category_id),topicId:String(row.topic_id),status,marks};
          database.prepare('INSERT OR IGNORE INTO learning_content VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'question',null,title,id,String(row.category_id),String(row.topic_id),'',status,JSON.stringify(data),1,now,now);
          database.prepare('INSERT OR IGNORE INTO practice_set_questions VALUES(?,?,?,?)').run(String(row.lesson_id),id,Number(row.position),marks);
        }
        database.prepare('INSERT INTO student_migrations VALUES(3,?)').run(now);database.exec('COMMIT');
      }catch(error){database.exec('ROLLBACK');database.close();throw error;}
    }
    if (!database.prepare('SELECT 1 FROM student_migrations WHERE version=4').get()) {
        database.exec('BEGIN IMMEDIATE');
        try {
            database.exec(readFileSync(resolve('lib/student/migration-4.sql'), 'utf8'));
            database.prepare('INSERT INTO student_migrations VALUES(4,?)').run(new Date().toISOString());
            database.exec('COMMIT');
        } catch (error) { database.exec('ROLLBACK'); database.close(); throw error; }
    }
    if (!database.prepare('SELECT 1 FROM student_migrations WHERE version=5').get()) {
        database.exec('BEGIN IMMEDIATE');
        try {
            database.exec(readFileSync(resolve('lib/student/migration-5.sql'), 'utf8'));
            database.prepare('INSERT INTO student_migrations VALUES(5,?)').run(new Date().toISOString());
            database.exec('COMMIT');
        } catch (error) { database.exec('ROLLBACK'); database.close(); throw error; }
    }
    connection = database;
    return database;
}
export function studentTransaction<T>(fn: () => T): T { const d = studentDb(); d.exec('BEGIN IMMEDIATE'); try {
    const result = fn();
    d.exec('COMMIT');
    return result;
}
catch (e) {
    d.exec('ROLLBACK');
    throw e;
} }
