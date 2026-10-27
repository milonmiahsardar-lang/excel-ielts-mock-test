CREATE TABLE students(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL COLLATE NOCASE UNIQUE,password_hash TEXT NOT NULL,joined_at TEXT NOT NULL);
CREATE TABLE profiles(student_id TEXT PRIMARY KEY REFERENCES students(id),mobile TEXT NOT NULL DEFAULT '',dob TEXT NOT NULL DEFAULT '',country TEXT NOT NULL DEFAULT '',level TEXT NOT NULL,goal TEXT NOT NULL);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),expires_at INTEGER NOT NULL);
CREATE INDEX student_sessions ON sessions(student_id);
CREATE TABLE rate_limits(scope TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
CREATE TABLE password_resets(token_hash TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),expires_at INTEGER NOT NULL);
CREATE TABLE categories(id TEXT PRIMARY KEY,name TEXT NOT NULL);
CREATE TABLE topics(id TEXT PRIMARY KEY,category_id TEXT NOT NULL REFERENCES categories(id),slug TEXT NOT NULL,title TEXT NOT NULL,UNIQUE(category_id,slug));
CREATE TABLE lessons(id TEXT PRIMARY KEY,topic_id TEXT NOT NULL REFERENCES topics(id),title TEXT NOT NULL,instructions TEXT NOT NULL DEFAULT '',published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE questions(id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL REFERENCES lessons(id),position INTEGER NOT NULL,content TEXT NOT NULL,key_json TEXT NOT NULL,UNIQUE(lesson_id,position));
CREATE TABLE practice_attempts(id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),lesson_id TEXT NOT NULL REFERENCES lessons(id),lesson_version INTEGER NOT NULL,started_at TEXT NOT NULL,submitted_at TEXT,status TEXT NOT NULL CHECK(status IN ('in-progress','completed','pending-review')),question_count INTEGER NOT NULL,correct_count INTEGER,elapsed_seconds INTEGER,result_json TEXT,question_snapshot TEXT NOT NULL);
CREATE INDEX student_history ON practice_attempts(student_id,started_at DESC);
CREATE TABLE practice_answers(attempt_id TEXT NOT NULL REFERENCES practice_attempts(id),question_id TEXT NOT NULL,answer_json TEXT NOT NULL,status TEXT NOT NULL,PRIMARY KEY(attempt_id,question_id));
-- No cross-database foreign key or automatic email matching. Only an explicit operator link grants read-only mock history visibility.
CREATE TABLE mock_links(student_id TEXT PRIMARY KEY REFERENCES students(id),candidate_id TEXT NOT NULL UNIQUE,linked_at TEXT NOT NULL,linked_by TEXT NOT NULL);
