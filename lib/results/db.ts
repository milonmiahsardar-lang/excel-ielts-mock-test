import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { defaultBands } from "./scoring";
import { inferHistoricalExposure } from "./exposure-history";
let database: DatabaseSync | undefined;
// Runtime databases live on writable storage and must not be bundled as source assets.
export function databasePath(){return resolve(/*turbopackIgnore: true*/ process.env.RESULTS_DB_PATH||"private/results.sqlite");}
export function db() {
  if(database) return database;
  const path=databasePath();
  if(process.env.RAILWAY_ENVIRONMENT_NAME){
    const mount=process.env.RAILWAY_VOLUME_MOUNT_PATH;
    if(!mount||!process.env.RESULTS_DB_PATH||!path.startsWith(resolve(mount)+sep))throw new Error("Railway requires a persistent volume and RESULTS_DB_PATH inside that volume. See OPERATIONS.md.");
    if(process.env.CLASSROOM_HTTP==="true")throw new Error("CLASSROOM_HTTP must not be enabled on Railway.");
  }
  mkdirSync(dirname(path),{recursive:true});
  database=new DatabaseSync(path);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,registration_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,contact TEXT NOT NULL DEFAULT '',role TEXT NOT NULL CHECK(role IN ('student','admin')),password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES users(id),test_id INTEGER NOT NULL CHECK(test_id BETWEEN 1 AND 20),started_at TEXT NOT NULL,submitted_at TEXT,data TEXT,released INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS student_attempts ON attempts(student_id,test_id);
    CREATE TABLE IF NOT EXISTS answer_keys(test_id INTEGER NOT NULL,skill TEXT NOT NULL,config TEXT NOT NULL,PRIMARY KEY(test_id,skill));
    CREATE TABLE IF NOT EXISTS notification_outbox(id TEXT PRIMARY KEY,submission_id TEXT NOT NULL REFERENCES attempts(id),event TEXT NOT NULL,created_at TEXT NOT NULL,delivered_at TEXT);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor_id TEXT,event TEXT NOT NULL,target_id TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_limits(account TEXT PRIMARY KEY,failures INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS test_assignments(id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES users(id),test_id INTEGER NOT NULL CHECK(test_id BETWEEN 1 AND 20),assigned_at TEXT NOT NULL,expires_at TEXT,status TEXT NOT NULL CHECK(status IN ('ASSIGNED','IN_PROGRESS','SUBMITTED','REVOKED')),attempt_limit INTEGER NOT NULL DEFAULT 1 CHECK(attempt_limit=1),attempts_used INTEGER NOT NULL DEFAULT 0 CHECK(attempts_used BETWEEN 0 AND 1),UNIQUE(candidate_id,test_id));
    PRAGMA user_version=2;`);
  if(!database.prepare("PRAGMA table_info(attempts)").all().some(c=>c.name==="assignment_id"))database.exec("ALTER TABLE attempts ADD COLUMN assignment_id TEXT REFERENCES test_assignments(id)");
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS active_assignment_attempt ON attempts(assignment_id) WHERE submitted_at IS NULL AND assignment_id IS NOT NULL");
  database.exec(`CREATE TABLE IF NOT EXISTS attempt_progress(
    attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
    stage TEXT NOT NULL CHECK(stage IN ('NOT_STARTED','LISTENING_ACTIVE','LISTENING_COMPLETED','READING_ACTIVE','READING_COMPLETED','WRITING_ACTIVE','COMPLETED')),
    deadline INTEGER,audio_duration REAL,audio_position REAL NOT NULL DEFAULT 0,
    audio_observed_at INTEGER,lease_owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0
  ); PRAGMA user_version=3;`);
  // Additive section preparation state preserves existing attempts and deadlines.
  const flowColumns=database.prepare("PRAGMA table_info(attempt_progress)").all().map(c=>c.name);
  for(const [name,definition] of [["pending_section","TEXT"],["instructions_confirmed","INTEGER NOT NULL DEFAULT 0"],["completion_acknowledged","INTEGER NOT NULL DEFAULT 0"]]){
    if(!flowColumns.includes(name))database.exec(`ALTER TABLE attempt_progress ADD COLUMN ${name} ${definition}`);
  }
  database.exec("PRAGMA user_version=4");
  // Preserve assignment IDs and every existing attempt/result while expanding
  // uniqueness from candidate/test to candidate/test/mode. No result is rescored.
  if(!database.prepare("PRAGMA table_info(test_assignments)").all().some(c=>c.name==="mode")){
    database.exec("PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE");
    try{
      database.exec(`CREATE TABLE test_assignments_modes(
        id TEXT PRIMARY KEY,candidate_id TEXT NOT NULL REFERENCES users(id),
        test_id INTEGER NOT NULL CHECK(test_id BETWEEN 1 AND 20),assigned_at TEXT NOT NULL,expires_at TEXT,
        status TEXT NOT NULL CHECK(status IN ('ASSIGNED','IN_PROGRESS','SUBMITTED','REVOKED')),
        attempt_limit INTEGER NOT NULL DEFAULT 1 CHECK(attempt_limit=1),
        attempts_used INTEGER NOT NULL DEFAULT 0 CHECK(attempts_used BETWEEN 0 AND 1),
        mode TEXT NOT NULL DEFAULT 'full' CHECK(mode IN ('full','listening','reading','writing')),
        UNIQUE(candidate_id,test_id,mode));
        INSERT INTO test_assignments_modes(id,candidate_id,test_id,assigned_at,expires_at,status,attempt_limit,attempts_used)
          SELECT id,candidate_id,test_id,assigned_at,expires_at,status,attempt_limit,attempts_used FROM test_assignments;
        DROP TABLE test_assignments;
        ALTER TABLE test_assignments_modes RENAME TO test_assignments;`);
      if(database.prepare("PRAGMA foreign_key_check").all().length)throw new Error("Assignment migration failed its relationship check.");
      database.exec("COMMIT");
    }catch(error){database.exec("ROLLBACK");throw error;}
    finally{database.exec("PRAGMA foreign_keys=ON");}
  }
  if(!database.prepare("PRAGMA table_info(attempts)").all().some(c=>c.name==="mode"))database.exec("ALTER TABLE attempts ADD COLUMN mode TEXT NOT NULL DEFAULT 'full' CHECK(mode IN ('full','listening','reading','writing'))");
  database.exec("PRAGMA user_version=5");
  if(!database.prepare("PRAGMA table_info(test_assignments)").all().some(c=>c.name==="purpose"))database.exec("ALTER TABLE test_assignments ADD COLUMN purpose TEXT NOT NULL DEFAULT 'fresh' CHECK(purpose IN ('fresh','repeat'))");
  if(!database.prepare("PRAGMA table_info(attempts)").all().some(c=>c.name==="purpose"))database.exec("ALTER TABLE attempts ADD COLUMN purpose TEXT NOT NULL DEFAULT 'legacy' CHECK(purpose IN ('fresh','repeat','legacy'))");
  database.exec(`CREATE TABLE IF NOT EXISTS module_exposures(
    attempt_id TEXT NOT NULL REFERENCES attempts(id),candidate_id TEXT NOT NULL REFERENCES users(id),
    test_id INTEGER NOT NULL,skill TEXT NOT NULL CHECK(skill IN ('listening','reading','writing')),
    first_seen_at TEXT NOT NULL,certainty TEXT NOT NULL CHECK(certainty IN ('seen','uncertain')),
    source TEXT NOT NULL CHECK(source IN ('history','activation')),PRIMARY KEY(attempt_id,skill));
    CREATE INDEX IF NOT EXISTS candidate_module_exposure ON module_exposures(candidate_id,test_id,skill);
    CREATE TABLE IF NOT EXISTS results_migrations(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL);`);
  if(!database.prepare("SELECT 1 FROM results_migrations WHERE name='module-exposure-history-v1'").get()){
    database.exec("BEGIN IMMEDIATE");
    try{
      const insert=database.prepare("INSERT OR IGNORE INTO module_exposures VALUES(?,?,?,?,?,?,'history')");
      for(const row of database.prepare("SELECT a.*,p.stage history_stage,p.audio_position history_audio_position FROM attempts a LEFT JOIN attempt_progress p ON p.attempt_id=a.id").all()){
        for(const exposure of inferHistoricalExposure(row))insert.run(String(row.id),String(row.student_id),Number(row.test_id),exposure.skill,String(row.started_at),exposure.certainty);
      }
      database.prepare("INSERT INTO results_migrations VALUES('module-exposure-history-v1',?)").run(new Date().toISOString());
      database.exec("COMMIT");
    }catch(error){database.exec("ROLLBACK");throw error;}
  }
  database.exec("PRAGMA user_version=6");
  const seed=resolve("private/test-1-approved-keys.json");
  if(existsSync(seed)) {
    const keys=JSON.parse(readFileSync(seed,"utf8"));
    for(const skill of ["listening","reading"]){database.prepare("INSERT OR IGNORE INTO answer_keys VALUES(?,?,?)").run(1,skill,JSON.stringify({...keys[skill],bands:defaultBands}));}
  }
  return database;
}
export function transaction<T>(action: ()=>T): T {
  const database=db();database.exec("BEGIN IMMEDIATE");
  try {const result=action();database.exec("COMMIT");return result;}catch(error){database.exec("ROLLBACK");throw error;}
}
