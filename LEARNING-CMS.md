# Learning CMS - implementation and operations

Implementation date: 27 October 2026. Website root: C:/Users/Asus/Desktop/ielts-reading.

## 1. Features implemented

The existing Student Portal is extended, not rebuilt. The Learning CMS uses the existing administrator login at /admin/login. Its navigation is available through the added Learning CMS link in the existing instructor navigation.

Implemented management areas:

- Actual-record overview: registered students, courses, lessons, bank questions, published/draft material counts, practice attempts and recent student activity.
- Courses: titles/slugs, descriptions, objectives, level, estimated duration, cover media, all-student/enrolled visibility, publication, duplication and archiving.
- Modules: course ownership and numeric display order. Lessons also have display order; student course pages respect module/lesson ordering.
- Existing categories: editable names, descriptions, supported icons, ordering, activation and nested parents. Existing category IDs/routes are preserved. Topics can be added/nested/reordered; existing topic category/slug controls are fixed to preserve links.
- Lessons: structured rich-text blocks for headings, paragraphs, bold/italic, numbered/bullet lists, tables, examples, highlighted rules, images, audio, PDF downloads and practice links; drafts, preview, publish/unpublish, duplicate, archive/restore.
- Question bank: eleven type identifiers (the ten requested types plus the original error-identification type), private keys, alternatives, explanations, marks, tags, category/topic/level, drafts, preview, publication, duplication and archive/restore. New multiple-choice questions require at least four options; adopted pre-CMS questions retain their legacy compatibility.
- Practice sets/assessments: search and paginated selection from published questions, selection across pages, reordering, per-question marks, optional time limit/passing score, explanation visibility and retry policy. Both use the existing portal practice engine.
- Bulk question import: CSV/XLSX/JSON, column mapping, category override, server-side validation, duplicate detection, preview errors, valid-row import and explicit overwrite confirmation. Unicode is supported.
- Media library: private uploads, image/audio previews and PDF downloads, rename, search/type filtering, pagination and confirmed deletion of unused files. Searchable, paginated media selectors attach files without limiting authors to the latest uploads.
- Student administration: search/level filtering, progress/history/per-category performance, linked mock summaries, course enrolment and confirmed access activation/deactivation. Deactivation revokes portal sessions. No student deletion/password disclosure is introduced.
- Analytics: actual practice accuracy, activity, category/topic performance and course completion against real participants and required published materials. Subjective work remains ungraded/pending review.
- Content settings: optional escaped-text dashboard welcome message. Audit log records content, upload, publication, import, enrolment and access changes.

All collections have server-side pagination (25 rows), supported search/filter/sort controls and empty/loading/error states. Destructive actions use explicit confirmation. Content is archived rather than deleting referenced educational/history records. Preview creates no attempt and changes no progress.

## 2. Files created

- `app/student/components/LessonContent.tsx`
- `app/admin/(secure)/learning/AdminCMS.tsx`
- `app/admin/(secure)/learning/BlockEditor.tsx`
- `app/admin/(secure)/learning/cms.module.css`
- `app/admin/(secure)/learning/ContentEditor.tsx`
- `app/admin/(secure)/learning/ImportPanel.tsx`
- `app/admin/(secure)/learning/MediaPicker.tsx`
- `app/student/(private)/courses/page.tsx`
- `app/admin/(secure)/learning/[[...section]]/page.tsx`
- `app/api/admin/learning/[resource]/route.ts`
- `app/api/learning/media/[id]/route.ts`
- `app/student/(private)/courses/[id]/page.tsx`
- `lib/learning/catalog.ts`
- `lib/learning/imports.ts`
- `lib/learning/media.ts`
- `lib/learning/permissions.ts`
- `lib/learning/queries.ts`
- `lib/learning/service.ts`
- `lib/learning/tabular.ts`
- `lib/learning/types.ts`
- `lib/learning/validation.ts`
- `lib/student/migration-2.sql`
- `scripts/backup-learning.mjs`
- `scripts/verify-learning-cms.cjs`
- `scripts/verify-learning-http.mjs`

Also created this LEARNING-CMS.md report. Existing documentation is retained, with a short current-CMS note added to STUDENT-PORTAL.md.

## 3. Files modified

- `app/admin/(secure)/layout.tsx`
- `app/student/components/PracticeEngine.tsx`
- `app/student/components/Sidebar.tsx`
- `app/student/components/UI.tsx`
- `app/api/student/practice/route.ts`
- `app/student/(private)/dashboard/page.tsx`
- `app/student/(private)/history/page.tsx`
- `app/student/(private)/practice/page.tsx`
- `app/student/(private)/progress/page.tsx`
- `app/student/(private)/practice/[category]/page.tsx`
- `app/student/(private)/practice/lesson/[id]/page.tsx`
- `app/student/(private)/practice/[category]/[topic]/page.tsx`
- `lib/student/accounts.ts`
- `lib/student/auth.ts`
- `lib/student/data.ts`
- `lib/student/db.ts`
- `lib/student/practice.ts`
- `lib/student/types.ts`
- `scripts/import-student-lesson.mjs`

The existing admin layout change adds only the Learning CMS navigation link. The remaining changes are portal integration or compatibility with its extended schema. No existing application file was removed.

Hash comparison against the 267-file baseline confirms that no existing mock test renderer, question data, media, timer, audio, scoring, candidate/admin authentication implementation or mock database migration code was changed. The homepage was not changed during this CMS task. Unrelated pre-existing working-tree changes were preserved.

## 4. Database migrations

The CMS stays in the existing private Student Portal SQLite database. Its path and WAL/foreign-key/busy-timeout architecture are reused. The mock results database is not extended.

- Version 1 remains the original portal schema.
- Version 2: lib/student/migration-2.sql adds student active status; category/topic metadata/nesting; versioned learning_content for courses/modules/bank questions; lesson metadata/kind/course/module/order/archive/timestamps; set-question relations; attempt policies/drafts; media; enrolments; lesson completions; audit and settings. Foreign keys, unique IDs/slugs and search/history indexes are included.
- Version 3: the transactional backfill in lib/student/db.ts adopts existing portal questions into the bank and links their original sets. It does not rewrite their original question/key strings or overwrite student records. Existing attempt snapshots/results remain intact.

Migrations run lazily on first portal database use and are recorded in student_migrations. They are transactional and non-destructive. Deploy SQL and TypeScript together. No lessons/courses/questions are invented or seeded.

Practice sets store approved question/key copies. New attempts snapshot those copies and their time/retry/explanation policy. Editing bank content cannot rewrite earlier submissions or in-progress question snapshots. Re-save/publish a set to apply a changed published bank question to future attempts. Unpublishing/archiving a bank question also unpublishes affected sets to prevent new exposure to withdrawn content. Old owned attempt results remain accessible.

## 5. New routes

Admin pages, all protected by the existing admin session:

- /admin/learning
- /admin/learning/students
- /admin/learning/courses
- /admin/learning/modules
- /admin/learning/categories
- /admin/learning/topics
- /admin/learning/lessons
- /admin/learning/questions
- /admin/learning/practice-sets
- /admin/learning/assessments
- /admin/learning/analytics
- /admin/learning/media
- /admin/learning/drafts
- /admin/learning/published
- /admin/learning/import
- /admin/learning/settings
- /admin/learning/audit

New student routes: /student/courses and /student/courses/[id]. Existing practice/category/topic/lesson routes are reused and now load database-managed material.

## 6. API endpoints

GET/POST /api/admin/learning/[resource], where resource is one of courses, modules, categories, topics, lessons, questions, practice-sets, assessments, students, media, settings, import or the read-only overview/lookup/analytics/audit areas.

- GET collections: q, category, topic, difficulty, type, status, date, sort, direction and page where applicable.
- GET ?id=... loads a record. Add preview=1 for safe admin previews.
- POST a record saves it. action supports duplicate, publish, unpublish, archive and restore; archive requires confirm:true.
- Questions support action:bulk, up to 25 selected IDs per request, with per-record results.
- POST /api/admin/learning/import: action parse, preview or commit.
- GET /api/admin/learning/export?format=csv|xlsx|json; template=1 downloads empty templates.
- POST /api/admin/learning/media-upload sends the raw file with an encoded x-file-name header.
- POST media supports rename or confirmed deletion of an unused file.
- POST students supports confirmed access changes and explicit course enrolment.
- GET /api/learning/media/[id] authorizes the admin or an eligible student and supports byte ranges.
- Existing /api/student/practice gains save-draft and complete-lesson actions. Its start/get/submit paths preserve authenticated ownership and use the same portal grader/history.

No mock API or mock submission/scoring endpoint was modified.

## 7. Security measures

- Every CMS page and API requires the existing server-side administrator role. Student cookies do not confer CMS access.
- Mutations verify exact same origin, bounded request bodies, server-side data validation and throttling.
- Parameterized SQL, allowlisted resource names/sorts and structured content validation are used. Version checks reject stale editor saves.
- Published questions must have type-correct options/keys, matching pairs or rearrangement sequences, valid word limits and valid classification. Free-text does not receive invented scores.
- Student lesson/set/course/media access checks active taxonomy, publication, parent course/module status and enrolment where required. Direct URLs do not bypass these checks.
- Correct answers, alternatives and keys are excluded from student question responses before submission. Explanations/accepted answers follow the set's post-submission visibility policy.
- Lesson formatting is structured text rendered as React elements, not arbitrary HTML. HTML/script text is escaped; no dangerouslySetInnerHTML or unrestricted external embeds are used.
- Upload types are detected from bytes. SVG/HTML/executable uploads are rejected. Files get random server filenames outside public storage. PDF is download-only; responses use nosniff and a restrictive CSP. Referenced/historical files cannot be deleted.
- Portal deactivation revokes portal sessions only; it does not change candidate/admin accounts or mock assignments.

## 8. Student Portal integration

The same dashboard, My Practice cards, categories, topic pages, practice engine, progress and learning history are reused. Category names/descriptions/icons/order and topic nesting come from SQLite. Published course/module/lesson/set changes appear on subsequent page loads without source edits.

Students can read eligible courses/lessons, mark lessons complete, start published sets/assessments, autosave answers, submit, receive objective scores/feedback and view history. Matching/choice values are option IDs/letters; completions remain strings. Marks and passing scores are portal practice features, not changes to IELTS mock marking.

Timed portal practice uses a server-derived deadline. The client auto-submits at expiry; the server uses the last saved draft after the final-save grace. An expired attempt not finalized while offline is finalized when fetched again, rather than claiming a new background scheduler. Retries are enforced server-side. Untimed writing submissions enforce configured minimum word requirements; expired timed work is saved for review.

Progress is calculated from actual eligible published material and saved lesson/attempt completion. Unenrolled restricted courses do not inflate the denominator. History includes saved practice and lesson completion records without manufacturing quiz attempts. Linked mock summaries remain read-only and retain release rules.

## 9. Import templates and instructions

Use Content Import / Export in the CMS. Download CSV/XLSX/JSON templates. CSV/XLSX templates contain headers only; JSON is an empty array. The documented unified format supports all question types without creating sample educational content.

Canonical fields: id (optional for new records), categoryId, topicId, type, difficulty, prompt, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, structured.

Use a category/topic ID from its editor for unambiguous matching. Unique category/topic names are also accepted. Friendly aliases category, topic, question_type and question are supported, and underscore type names are normalized to hyphenated identifiers.

Simple choice rows use option_a-d and a correct_answer such as B. Text-answer rows may use correct_answer for one answer. For alternatives or complex types use a JSON object in structured, or JSON array records with these properties:

- type: multiple-choice, fill-in-the-blanks, sentence-completion, true-false, true-false-not-given, matching, sentence-rearrangement, error-correction, short-answer, free-text or the existing error-identification.
- options/items: arrays of {id,text}.
- accepted: approved answer strings or the correct option ID (one choice answer).
- pairs: {leftItemID:rightOptionID} for matching.
- sequence: ordered item IDs for rearrangement.
- explanation, optional minWords/maxWords, marks, tags, instructions, passage, mediaIds, sampleAnswer and criteria as appropriate.

Sample answers and criteria remain private key data. Structured field contents override flat columns, followed by any category override selected in the UI. Explicit statuses are preserved; otherwise imports default to draft. Review the file and validation preview before importing. No existing question is overwritten unless overwrite is explicitly enabled and confirmed. Invalid/duplicate rows are reported and skipped; valid rows have independent transaction results.

Limits: 4 MB per import file, 1,000 questions per import, 100 columns, 100 questions per practice set. Split larger collections into batches. A complete question export supports up to 10,000 bank records; larger collections require the complete Learning database backup rather than silent truncation. Exports preserve structured data and protect spreadsheet users from formula injection.

XLSX support is intentionally tabular: ordinary stored/deflated OOXML worksheets, shared/inline strings and scalar values. It does not evaluate formulas or macros. Import a plain values-only first worksheet using the provided template; do not expect Excel formatting, merged-layout documents or macros to become question structure. The supported round-trip was tested; arbitrary third-party workbook variants were not certified.

## 10. Deployment, storage, backup and restore

No packages, database provider or hosting configuration were changed. No deployment was performed.

Use Node 24 and the existing Next.js deployment. Keep existing authentication/result environment settings. Student storage must be private, writable and persistent:

- STUDENT_DB_PATH: existing student database path; defaults to students.sqlite beside RESULTS_DB_PATH.
- STUDENT_MEDIA_DIR: optional; defaults to learning-media beside the student database.
- LEARNING_BACKUP_DIR: optional private backup destination.

On Railway, database and media paths must be inside the persistent volume. Do not use temporary deployment storage or public/ for uploads. Include lib/student/migration.sql and migration-2.sql in custom packaging. Back up existing storage before deploying the schema extension. Restart/deploy only through the approved operational process.

Create a complete, consistent portal/CMS backup from the project root:

    node scripts/backup-learning.mjs

It snapshots SQLite, verifies integrity, copies the media named in that snapshot, checks SHA-256 hashes and writes manifest.json. It does not report success if a file/check fails. Schedule this separate command through the existing authorized infrastructure before relying on the CMS for production content. The existing mock backup job remains unchanged and does not include portal media.

Restore procedure (operator maintenance, not performed by this task):

1. Stop portal/application writes and keep the current private database, WAL/SHM and media together as a retained rollback copy. Do not delete WAL/SHM to force a restore.
2. Verify the chosen backup manifest, SQLite integrity/foreign keys and every media hash. Restore database and media from the same backup to a new private persistent directory.
3. In the restored Student database only, revoke restored sessions/reset tokens before reopening access; do not run this against the mock database.
4. Point STUDENT_DB_PATH and STUDENT_MEDIA_DIR at the verified restored copies using the approved deployment procedure, then restart and verify administrator/student access and a disposable content workflow.
5. Retain the prior database/media until the restore is accepted. The existing mock restore script must not be used on the Student database.

The original scripts/backup-students.mjs remains database-only. Prefer the complete Learning backup for CMS installations. Prefer the CMS authoring/import tools for new educational materials rather than mixing legacy source-oriented imports with published CMS management.

## 11. Verification results

Executed on disposable storage; no fixture courses/questions/students were added to the real portal:

- TypeScript no-emit check: passed.
- Scoped ESLint: passed.
- Production Next.js build: passed. The pre-existing unrelated parent lockfile warning remains unchanged.
- Learning CMS service suite: 16 verification groups passed, including v1-to-v3 preservation, publication, five-question weighted grading, history snapshots, ownership, time/retry policies, legacy/new question types, Unicode CSV/XLSX/JSON, 1,000-row import, media restrictions, nesting, pagination, analytics/audit and complete backup.
- Production CMS HTTP suite: 14 groups passed. It uses the real existing admin login against an isolated mock database and verifies all CMS page guards, role/CSRF rejection, course/lesson/set delivery, scoring/history, hidden keys, old-result preservation, student isolation, protected media/ranges, export/import previews, analytics/audit and access revocation.
- Existing portal service suite: 19 groups passed after extension.
- Existing portal production HTTP suite: 14 groups passed after extension, including all seven original categories and 35 original topics, registration/login/profile/logout and candidate-login separation.
- Existing-file hashes: no mock-test code, data or media changed; no source files removed. The only pre-existing non-portal application file changed was the admin layout's added CMS link.

Commands:

    node scripts/verify-learning-cms.cjs
    node scripts/verify-learning-http.mjs
    node scripts/verify-student-portal.cjs
    node scripts/verify-student-http.mjs
    node node_modules/typescript/bin/tsc --noEmit --incremental false
    npm.cmd run build

HTTP suites require a successful build. They start/stop their own localhost production servers and remove their temporary databases/media. They must not be redirected to real student storage.

## 12. Remaining limitations / verification boundaries

- Client editing and responsive layouts are implemented and compile/lint, but a complete interactive desktop/mobile browser pass was not completed. The user's browser was actively on production candidate login; it was left untouched. HTTP rendering is not claimed as a visual/mobile pass.
- No real deployment, Railway volume setup, production concurrency test or full timed IELTS mock rerun was performed. Preservation is supported by unchanged mock source/media and guarded route checks, not a fabricated end-to-end exam pass.
- Publication is immediate/manual; scheduled publication is not enabled.
- Lesson authoring is a structured block editor with live preview, not a general arbitrary-HTML/page-builder system. Images/audio/PDF must be uploaded to the protected media library. Practice links currently use a set ID.
- Free-text writing and subjective speaking are stored/reported as pending review or completion. No automatic speaking/writing scores, speech recording, AI marking or new manual-grading UI are claimed.
- Question-set edits intentionally affect future attempts only. Re-save a set when applying bank revisions. Archived/withdrawn content is hidden from new access; historical snapshots are retained.
- Collection/record editing has pagination and optimistic version checks where supported. There is no collaborative live editor, course commerce or granular content-editor role beyond the existing administrator role.
- Backup scheduling/restoration is an operator responsibility. The complete backup command was tested on disposable database/media; a real deployment restore was not performed.
