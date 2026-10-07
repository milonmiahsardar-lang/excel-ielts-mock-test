# Candidate test assignment security

## 1. Original cause
Candidate authentication checked only the student role. There was no candidate-to-test relationship, so any authenticated student could open every numbered test and start attempts. Attempt and result ownership checks already existed, but they did not restrict which tests could be started.

## 2. Files
Existing question components, passages, question datasets, approved answer keys, public images/audio, and visual styles were retained. The confirmation, listening, instructions and reading client pages were moved into TestClient.tsx files and wrapped with server authorization pages.

### Modified
- `app/page.tsx`
- `app/confirm/page.tsx`
- `app/listening/page.tsx`
- `app/test/page.tsx`
- `app/verify/page.tsx`
- `app/admin/(secure)/layout.tsx`
- `app/api/submissions/route.ts`
- `app/api/attempts/start/route.ts`
- `app/api/attempts/[id]/section/route.ts`
- `app/listening/instructions/page.tsx`
- `app/test/writing/page.tsx`
- `app/test/writing/result/page.tsx`
- `lib/results/client.ts`
- `lib/results/db.ts`
- `lib/results/http.ts`
- `lib/results/store.ts`

### Created
- `app/candidate/page.tsx`
- `app/confirm/TestClient.tsx`
- `app/listening/TestClient.tsx`
- `app/test/TestClient.tsx`
- `app/admin/(secure)/assignments/AssignmentForm.tsx`
- `app/admin/(secure)/assignments/page.tsx`
- `app/api/admin/assignments/route.ts`
- `app/listening/instructions/TestClient.tsx`
- `lib/results/assignments.ts`
- `lib/results/TestAccess.tsx`

## 3. Database changes
SQLite schema version 2 adds test_assignments with candidate foreign key, test ID, assignment time, optional expiry, status, attempt limit, attempts used and a unique candidate/test pair. All assignments currently permit one completed attempt. EXPIRED is derived from the stored expiry. attempts gains nullable assignment_id and a unique index preventing multiple unfinished attempts for the same assignment. Existing records are retained; existing candidates receive no implicit assignments.

## 4. Assignment model
Identity comes from the authenticated server session. assignmentFor verifies the student, exact candidate/test relationship, revocation, expiry and remaining attempt allowance. authorizeAttempt additionally verifies the attempt owner and matching assignment. Status moves ASSIGNED → IN_PROGRESS → SUBMITTED. Refresh/start retries reuse the same unfinished attempt. Submission and assignment consumption occur in the same SQLite transaction.

## 5. Admin workflow
Visit /admin/assignments after admin login. Select a candidate and Full Mock Test, optionally choose an expiry in your local time, then Assign test. The table shows current state, expiry and attempts used. Revoke blocks future page/API requests immediately. An explicit reset/reassign checkbox grants one fresh attempt while retaining previous attempt records for admin review. Repeated assignment without reset returns 409 rather than duplicating rows. A first explicit assignment can attach the candidate's matching existing unfinished draft; it never grants permission to another test or another person's draft.

## 6. Candidate pages and direct URLs
Candidate login goes to /candidate. The server queries only that candidate's non-revoked, non-expired assignments. Submitted assignments have no Start link. The public homepage remains visible to logged-in candidates. The candidate login page redirects authenticated candidates to their dashboard. /confirm, /listening/instructions, /listening, /test and /test/writing validate the requested test on the server before rendering their test UI, including query changes during navigation. Invalid/unassigned/revoked/expired/exhausted requests render Access Denied; unknown paths remain unavailable. Because Next.js can stream page responses, denied pages may have HTTP 200 while rendering only the denial UI. API authorization returns 403.

/test/writing/result checks submission ownership and its assignment on the server before rendering a confirmation or released result. Admin result routes require admin authorization. Legacy submissions remain available to instructors; their old IDs cannot authorize a new attempt.

## 7. API controls and keys
/api/attempts/start checks exact assignment. /api/attempts/[id]/section and /api/submissions verify session ownership and matching current assignment in a transaction. A wrong test ID is rejected; another candidate's attempt is unavailable. Browser-supplied candidateId, studentId, assignmentId and submissionId overrides are rejected. The candidate response contains only its own attempt identity or submission confirmation, never correct answers or scoring details. Keys and scoring remain server-only; /api/admin/keys and /api/admin/results require an admin session. Local draft recovery revalidates the attempt with the server and clears IELTS browser storage if the authenticated identity has changed.

## 8. One-attempt and reset protection
Submitted assignments cannot start, edit or render a fresh test. A duplicate final submission returns the same confirmation without another record, score consumption or notification. Explicit admin reset detaches old attempts from the assignment so their IDs cannot edit/submit against the fresh allowance. A new active attempt is then created once. Revocation and expiry are enforced on subsequent server requests, including saving/submission.

## 9. Migration/environment
Migration runs automatically when the application first opens the SQLite database; it has already run locally. No manual SQL command or new environment variable is needed. Continue using existing ADMIN_USERNAME, ADMIN_PASSWORD and RESULTS_DB_PATH. For production, rebuild and restart the existing server with npm run build and npm run start. Back up and retain the existing SQLite file on persistent storage. Assign each real candidate a test before they can begin; there are no automatically granted assignments.

## Verification
Type checking, production build and lint were run. Lint has no errors and the same 15 existing warnings. Authorization checks exercised A→1/B→2 allowed, opposite assignments denied, direct page URLs, candidate-only dashboard queries, tampered identifiers, section writes, final submissions, private keys/results, duplicate starts/submissions, one-attempt reuse protection, revocation, expiry, explicit reset and matching legacy-draft adoption. Browser verification confirmed both isolated dashboards, direct URL denial and normal start of an assigned test. Disposable test accounts, assignments, attempts and related records were removed; real candidate/admin records and existing submissions were preserved. Hash comparisons confirmed no changes to original test renderer components, JSON datasets or public assets.

Evidence and executable checks are saved in the workspace work/assignment-security directory.


## Website audit update (2026-10-05)
Reading/Listening drafts and both Writing tasks now recover from the candidate-owned server attempt. Reading/Writing countdown deadlines persist on the server. See WEBSITE-AUDIT.md for current checks and remaining limitations.
