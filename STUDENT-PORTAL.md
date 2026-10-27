# Student Portal

The Student Portal is an independent addition. Existing mock routes, candidate/admin sessions, mock databases, questions, timers, audio, submission, scoring and result release rules are unchanged. Only app/page.tsx and appended, scoped homepage CSS connect the new portal to the homepage. No dependency was added.

## Routes

Public: /student (redirect), /student/register, /student/login, /student/forgot-password, /student/reset-password.

Student-authenticated: /student/dashboard, /student/practice, /student/practice/[category], /student/practice/[category]/[topic], /student/practice/lesson/[id], /student/mock-tests, /student/progress, /student/history, /student/profile, /student/settings.

Categories: grammar, sentence-completion, vocabulary, reading, listening, writing, speaking. All 35 named topic routes are prepared. No educational lessons or questions are seeded. Unavailable topics have disabled Start Practice controls and never create attempts.

APIs: POST /api/student/register, login, logout, profile, password, forgot-password, reset-password; GET/POST /api/student/practice. All mutations validate JSON size and same-origin requests. Private APIs derive identity from the authenticated session, never a supplied student ID.

## Account security

- Independent accounts; no automatic conversion of existing candidate/admin accounts.
- Unique, case-insensitive email; server-side validation; 12-128 character passwords with a letter and number.
- Asynchronous Node scrypt with random salt, timing-safe verification. Passwords are not stored in plaintext.
- Random session tokens; only SHA-256 token hashes in SQLite. HttpOnly, SameSite=Lax cookies, Secure in production except the existing trusted classroom HTTP mode. Seven-day fixed session lifetime.
- Dedicated excel_student_session cookie. Portal logout does not clear candidate/admin cookies.
- Login, registration, recovery, email changes and password changes are throttled in SQLite. Expired limits are removed.
- Changing email requires the current password. Password changes and resets revoke all student sessions and reset tokens. Reset links are single-use and expire after 30 minutes.
- Email verification and a portal administration UI are not implemented in this phase. The portal does not confer mock access or candidate identity.

## Storage and migration

The portal follows the existing Node/SQLite approach but uses a separate private database to keep the frozen mock database and its migrations untouched.

STUDENT_DB_PATH defaults to students.sqlite beside RESULTS_DB_PATH (normally private/students.sqlite). It must not point at the mock results database or public directory. On Railway it must be inside the persistent volume. The first portal database use applies additive, transactional migration v1 in lib/student/migration.sql and seeds only the seven category names and 35 topic names.

Tables: student_migrations, students, profiles, sessions, rate_limits, password_resets, categories, topics, lessons, questions, practice_attempts, practice_answers, mock_links. Foreign keys, unique emails and IDs, category/topic relations and ownership/history indexes are enforced. Student progress is derived from owned attempts; mock history is read through an explicit link, not duplicated or rescored.

Attempt snapshots preserve question content and private keys at the lesson version used. Updating a lesson does not rewrite historical attempts. Submitted attempts are idempotent and results cannot be resubmitted with different answers. Typed answers are submitted together; unsubmitted typing is not autosaved. This limitation is stated before practice starts. Elapsed time is wall time since starting, including time away.

Completed practice counts include submitted pending-review activities. Accuracy uses objectively graded attempts only. Free-text answers are stored as pending review and receive no invented grade. There is no instructor practice-review UI yet. Learning progress is distinct submitted lessons divided by currently published non-empty lessons (capped at 100%). Average Score is the mean of available released mock module bands, not an official overall IELTS band. History shows up to 200 activities; activity charts use Bangladesh dates. Missing information displays an empty state or dash, never an artificial statistic.

## Environment and deployment

Required for public production: HTTPS, Node 24, writable persistent private storage, the existing APP_ORIGIN set to the exact public origin. Keep existing mock environment variables unchanged.

Optional portal variables:

- STUDENT_DB_PATH: absolute private database path, e.g. /data/students.sqlite.
- STUDENT_BACKUP_DIR: private directory for manual portal backups.
- STUDENT_RESET_WEBHOOK_URL: HTTPS mail integration endpoint.
- STUDENT_RESET_WEBHOOK_SECRET: private bearer secret for that endpoint.

Password-reset delivery is inactive unless APP_ORIGIN, STUDENT_RESET_WEBHOOK_URL and STUDENT_RESET_WEBHOOK_SECRET are configured and use HTTPS. Without them the UI explicitly states that no email was sent and directs students to Excel Institute. No token is returned to the browser or printed in logs.

The mail integration receives an authenticated HTTPS POST with JSON {to, resetUrl, expiresInMinutes:30}. It must send a password reset email to 'to' and return a 2xx response only when accepted for delivery. Do not point it at an untrusted service. The implementation uses a 10-second timeout and rejects redirects. Delivery failures are reported honestly. A real email-provider delivery was not verified by the local fixture checks.

Deploy new source and SQL migration together using the existing deployment process. Run TypeScript, scoped lint and the production build before deployment. Restart/deploy only when authorized. The portal database is initialized lazily; migration does not alter existing mock tables. For standalone/custom packaging include lib/student/migration.sql in the deployment. No deployment was performed for this implementation.

## Backups

The existing mock backup job backs up only the mock database. It intentionally remains unchanged. The portal has a separate backup command:

    node scripts/backup-students.mjs

Schedule this command with the environment pointing at the portal's persistent storage before accepting real registrations. Back up both databases separately and protect the backups as personal data. Portal restore is not automated: stop portal writes, validate a backup, retain the current database and restore under an authorized maintenance procedure. Do not reuse the mock restore script on the portal database.

## Linking existing mock history

An operator must verify that the student owns the candidate account, then run:

    node scripts/link-student-mock.mjs student@example.com CANDIDATE_ID OPERATOR_NAME --confirm-link

Run from the project root with the production database paths set appropriately. The link is one-to-one and records the operator and date. Existing links are not silently overwritten; duplicate links fail. This tool only inserts a portal link and opens the mock database read-only. It does not create candidates, change credentials, assign tests, alter exposure, submit attempts, release results or rescore anything. No real accounts were linked during implementation.

Linked students can see their available assignments and released summary bands. Unreleased scores remain hidden. The original candidate login is still required to take a test or view its detailed submission. There is no portal single sign-on to the mock engine. If mock storage is missing/unavailable, the portal shows an unavailable state rather than fabricating empty results.

## Adding real practice material later

Create a private JSON file with lesson metadata and questions. No public answer-key files should be created. Shape:

    {
      id: "unique-lesson-id",
      topicId: "grammar:tenses",
      title: "Your approved lesson title",
      instructions: "Your approved instructions",
      published: false,
      questions: [ /* approved question objects */ ]
    }

This is structural notation, not a ready-to-import JSON lesson. Replace all placeholders with approved material. Topic IDs are category:topic-slug; see lib/student/catalog.ts. Use published:false for drafts, then true to publish. Question IDs must be globally unique; updating a lesson increments its version and preserves attempt snapshots.

Every question has id, type, prompt and a private key containing explanation. Optional maxWords is validated and enforced during scoring. PracticeQuestion/QuestionKey in lib/student/types.ts are the data contracts.

| Type | Additional content | Private key |
| --- | --- | --- |
| multiple-choice | options:[{id,text}] | accepted:[correct option ID] |
| true-false | options:[{id,text}] | accepted:[correct option ID] |
| error-identification | options:[{id,text}] describing selectable fragments | accepted:[correct option ID] |
| fill-in-the-blanks | prompt; optionally maxWords | accepted:[approved strings] |
| short-answer | prompt; optionally maxWords | accepted:[approved strings] |
| sentence-completion | prompt; optionally maxWords | accepted:[approved strings] |
| matching | items:[{id,text}], options:[{id,text}] | pairs:{itemID:optionID} |
| sentence-rearrangement | items:[{id,text}] | sequence:[item IDs in order] |
| free-text | prompt | explanation; ungraded pending review |

Each completion question currently has one answer field. Split multi-gap tasks into separately numbered question objects. Choice and matching controls submit option IDs/letters, never option texts. Text matching normalizes case, NFKC and whitespace; it does not invent synonyms. Matching may reuse options; rearrangement requires every item once. Speaking topic pages are structure only: no audio recording/upload or speech scoring. Audio/image-based practice prompts need a future scoped extension; do not claim those features exist now.

Import from the project root after the portal migration has run:

    node scripts/import-student-lesson.mjs path/to/private-lesson.json --confirm-import

The importer validates all supported question/key structures, unique IDs, word limits, known topics and references, and writes the lesson transactionally. It is an operator tool, not a public content-management dashboard.

## Components and modules

app/student/components: Sidebar (responsive navigation/logout), Forms (registration/login/profile/password/recovery), UI (category cards, headings, empty states, progress meter and activity chart), PracticeEngine (question inputs, navigation, submission, feedback, results and retry). Styles are scoped in portal.module.css.

lib/student: catalog.ts, types.ts, db.ts + migration.sql, security.ts, auth.ts, accounts.ts, practice.ts, data.ts. No frozen mock component or mechanism is imported into the practice engine. The read-only mock adapter selects only linked candidates' summaries and never returns answer keys.

## Verification

    node scripts/verify-student-portal.cjs
    node node_modules/typescript/bin/tsc --noEmit --incremental false
    node node_modules/eslint/bin/eslint.js app/student app/api/student lib/student scripts/student-*.mjs scripts/link-student-mock.mjs scripts/backup-students.mjs scripts/import-student-lesson.mjs scripts/verify-student-portal.cjs
    npm.cmd run build

The verification script uses temporary databases and disposable fixtures. It checks authentication/account changes/reset lifecycle, uniqueness, empty states, student isolation, nine practice type graders, letter values, word limits, idempotent submissions, pending review, lesson imports, mock release protection, throttling, CSRF validation, backups and integrity. Fixtures are not imported into the real site. Separate HTTP checks and their actual results should be reported in the implementation handoff. Browser layout checks, real email delivery, real classroom exam operation and deployment are separate validations; do not infer them from unit/service checks.


### Implementation verification record - 27 October 2026

- TypeScript check passed (no emit, incremental disabled).
- Scoped ESLint passed for the portal and its operational/service-verification scripts.
- Production build passed with Next.js 16.4.3 after allowing the existing Google Font downloads. The unrelated parent-directory lockfile warning remains; no lockfile/root/font configuration was changed.
- Service verification passed 19 groups against temporary databases, including actual reset-token delivery via a stubbed mail transport (not an external email provider).
- Production HTTP verification passed 14 groups using a separate localhost server and temporary databases, covering all seven categories and 35 topic routes, registrations, duplicate registration, authentication cookies/redirects, account isolation, profile edits, unavailable practice and reset states, logout/login and separation from candidate authentication.
- Desktop My Practice was visually inspected in Chrome: navigation, card grid, typography and category descriptions displayed correctly. Mobile media queries and collapsible navigation are implemented; interactive mobile browser verification was not completed because browser interaction was detected. No visual mobile pass is claimed.
- Existing-file SHA-256 comparison: only app/page.tsx and app/homepage.module.css changed among 228 pre-existing application/library/media/script files. No existing file was removed. All mock test code/data/media and supporting mechanisms were unchanged. A complete timed mock was not rerun.
- No real candidate accounts, mock attempts, answer keys, result releases, scores or assignments were changed by these verification runs. No deployment or real account linking was performed.

Production HTTP checks can be repeated after a successful build:

    node scripts/verify-student-http.mjs

This starts and stops its own isolated localhost production server, uses disposable student/mock storage, and removes its fixtures afterwards.


## Learning CMS extension (27 October 2026)

The portal now has a database-driven Learning CMS at /admin/learning, using the existing administrator login. See [LEARNING-CMS.md](LEARNING-CMS.md) for the current v2/v3 migration, authoring, publication, course visibility, practice policies, complete database-and-media backup and verification instructions. That report supersedes the phase-one notes about missing administration and practice autosave. Mock test mechanisms remain unchanged.
