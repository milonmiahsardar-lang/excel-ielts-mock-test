# Mock-test results system

## Start using it

1. Run the existing website as usual.
2. Open `/admin/login`, then `/admin/results`.
3. The initial instructor username is `admin`. Its generated password is in `.env.local` under `ADMIN_PASSWORD`. It has not been placed in browser code or this report.
4. Open **Students** (`/admin/students`) and create each candidate's full name, registration ID, optional contact and password. The registration ID is their candidate-login username. The former shared browser-only login is replaced by server-authenticated individual accounts.
5. Students follow the existing Listening → Reading → Writing flow. **Finish Test** saves the database submission, shows the Thank You page for five seconds, then revokes the candidate session and returns to Candidate login. Submission details remain available to the owner after login.
6. In **Results**, select **View Submission** to inspect all answers and Writing responses, enter the eight Writing criterion scores, and save. Task bands and the combined Writing band are calculated automatically; Task 2 receives twice Task 1's weight before the final mock band is rounded to the nearest half band.
7. Feedback remains private unless the instructor explicitly selects **Release the marked result to this student**. The student's original confirmation URL then shows the released bands and feedback, but never answer keys.

## Scoring

Only Test 1 has approved Listening and Reading keys, using the answers provided in this chat. Reading corrections include Q16 `single`, Q20 `TRUE`, Q34 `NO`, Q40 `B`, and Q8 accepts `niece` or `his niece`. Listening Q38 requires both D and F; Q40 requires both A and C. Each pair is one question, matching the existing interface. Letter order does not affect these pairs.

Tests 2–20 have no approved keys in this system yet. Their scores remain **Awaiting answer key**, rather than receiving fabricated marks. Test content is unchanged. Other Reading renderers retain their existing browser-storage continuation flow; their answers are imported at final submission. Refresh recovery and early server scoring were verified end to end for Test 1. Further keys and per-test scoring checks can be added one by one.

Use `/admin/keys` to load a test/skill, configure accepted alternatives, word limits, unordered multi-question groups and conversion thresholds. Setting `approved: true` requires all 40 answers. Saving configuration deliberately rescores existing submissions for that test/skill and writes an audit event. Default Listening/Academic Reading bands are configurable mock-test estimates: actual IELTS raw-score boundaries can vary between papers. No four-skill IELTS overall band is calculated.

Example question configuration:

```json
"8": { "accepted": ["niece", "his niece"], "maxWords": 2 }
```

For two separate answer positions that may appear in either order, use `"groups": [[5,6]]`. For one question whose answer is a pair, use an accepted string such as `"D,F"`.

## Database and environment

There was no existing database or authentication service. The feature uses Node's built-in SQLite support (Node 22.13+; developed and checked with Node 24.21), without adding dependencies or an ORM.

Environment variables in `.env.local`:

- `ADMIN_USERNAME`: initial instructor login identifier.
- `ADMIN_PASSWORD`: initial password, at least 12 characters. An existing admin is not overwritten when this value changes; it is bootstrap configuration, not a password-reset mechanism.
- `RESULTS_DB_PATH`: database path; defaults to `private/results.sqlite`.

The private database folder and environment files are excluded from Git. Keep the database on persistent writable disk. This local SQLite implementation needs one persistent application host/shared local database; it must not be deployed to ephemeral serverless storage or unrelated replicas. Serve production over HTTPS for the Secure session cookie. Back up the private directory with the application stopped, including any SQLite WAL/SHM files. On another host, transfer approved private keys securely or configure them through the admin editor; do not move them into `public`.

Tables: `users`, `sessions`, `attempts`, `answer_keys`, `notification_outbox`, `audit`, `login_limits`. Schema version 1 is initialized automatically. Attempts contain complete serialized skill results and Writing responses, Writing criterion/band/feedback records and a future Speaking slot. Sessions store hashed random tokens, not plaintext tokens; passwords use salted scrypt hashes.

## Authorization and reliability

- Admin pages and APIs check the authenticated server-side role. Detailed result pages perform their own check as well as the protected admin layout.
- Student attempts and confirmation pages check database ownership. Student-provided identity and score fields are ignored.
- Correct keys live in server-only code/private storage. Students cannot request them through an API.
- Mutations require same-origin JSON, validate question numbers/lengths/types, and enforce bounded request bodies. React escapes submitted text when displaying it.
- Authentication attempts are limited per account, and logout revokes the server session.
- Final submission and its future notification event are committed in one transaction. An existing completed attempt returns its original confirmation, including after concurrent retries.
- Local drafts are retained through server errors and refresh. They are not cleared before successful submission. Attempt IDs stay stable on retries; explicitly starting another test from confirmation creates/reuses the appropriate server attempt.
- Email is not required or sent. `notification_outbox` supplies an event for a future email worker.

## Routes / APIs

Pages: `/admin/login`, `/admin/results`, `/admin/results/[id]`, `/admin/students`, `/admin/keys`, `/test/writing/result?id=...`.

APIs:

- `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/attempts/start`
- `POST /api/attempts/[id]/section`
- `POST /api/submissions`
- `POST /api/admin/students`
- `GET/PATCH /api/admin/results/[id]`
- `GET/PUT /api/admin/keys`

## Files

Created: `lib/results/{types,scoring,db,auth,http,store,client}.ts`, `types/sqlite.d.ts`, the API route handlers listed above, admin page/layout/form files, student-auth layouts for `app/confirm`, `app/listening`, `app/test`, private Test 1 approved-key JSON, the SQLite database, and this report.

Modified: `app/verify/page.tsx`, `app/confirm/page.tsx`, `app/listening/page.tsx`, `app/test/page.tsx`, `app/test/writing/WritingTestClient.tsx`, `app/test/writing/result/page.tsx`, `.gitignore`, `.env.local`.

Build/lint repairs: `app/layout.tsx` adds the required Suspense boundary; the previously empty `app/review/page.tsx` redirects to home; `app/page.tsx` and `app/listening/instructions/page.tsx` use Next Link in place of ordinary internal anchors. These changes do not change page styling or test content.

All question/passage data, writing prompts, images/audio, and individual test renderer components are unchanged.

## Checks performed

- Production build and TypeScript pass.
- Whole-project ESLint: zero errors; 15 existing warnings (images, hook dependencies and unused legacy declarations).
- Scoring checks: Test 1 perfect/empty answers, accepted alternatives, unordered pairs, duplicate-choice rejection, word limits, pending keys, word counts and 1:2 Writing weighting.
- Real API/database checks: server scoring, 40 answers per skill, correct/incorrect/unanswered states, full Unicode/multiline Writing, ignored forged scores/identity, atomic persistence, concurrent duplicate submissions, private keys, admin-only APIs/pages, ownership checks, invalid request origin, Writing marking/release, revoked sessions and one notification-outbox event.
- Browser: candidate login, confirmation/start, Listening answer recovery after refresh, Reading continuation, both Writing responses and refresh recovery, final confirmation, Admin Results retrieval, full Writing display and successful manual marking.
- Generated QA students/submissions were removed; the actual instructor account and approved Test 1 keys remain.

No deployment or external notification has been performed.


## Session update (2026-10-05)
Admin and Candidate authentication now use separate role cookies. Successful final submission shows the Thank You page, then logs out only the candidate after five seconds. See SUBMISSION-SESSION-FIXES.md for current flow, verification and rollout details.
