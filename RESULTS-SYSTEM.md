# Mock-test results system

See [OPERATIONS.md](OPERATIONS.md) for current setup, backup, classroom trial and deployment instructions.

## Candidate flow

Create a candidate at `/admin/students` and assign a ready test at `/admin/assignments`. The registration ID is the candidate username. Clicking a test asks for credentials. Each assignment permits one submission. Reassigning the same test creates a fresh attempt while keeping previous submissions.

Listening, Reading and Writing are controlled by server-side stages, timers and tab leases. An unfinished attempt cannot be reopened in another tab or after refresh; the same open tab may recover a temporary connection interruption. Assignment expiry prevents starting after the deadline, but does not stop an already started test. Revocation ends access. Interrupted test reassignment/revocation requires confirmation.

Finish saves the submission and shows the Thank You page before candidate logout. Candidates can sign in to view their own previous submissions; scores/feedback remain private until released. They never receive accepted answer keys.

## Keys and marking

The local database contains approved 40-question keys for Listening and Reading Tests 1-10. Tests 11-20 await approved keys. A ready full test needs both complete approved keys and its Listening recording. Presence checks do not verify audio content.

The private key editor at `/admin/keys` configures accepted alternatives, word limits, unordered question groups and band thresholds. Approval requires all 40 answers. Approved changes rescore unreleased submissions and retain a private audit history; released grades stay unchanged. Draft configurations do not erase grades. Identical configurations are not rescored.

Unordered groups use maximum matching and prevent duplicate selections earning multiple marks. A single question with several required choices can use one accepted string such as `D,F`; the order of those letters is normalized. Word limits apply to accepted alternatives and submitted answers.

Listening/Academic Reading band conversions are configurable mock-test estimates. Writing requires instructor scores for achievement, coherence, vocabulary and grammar on each task. Task 2 has twice Task 1's weight. This website does not calculate an official four-skill IELTS overall band or a Speaking score.

## Administration

Results are filtered in the database, paginated at 25 per page and exportable as a protected CSV. Candidate edit supports profile changes and password reset. An active test blocks password reset until it is ended/reassigned. `/admin/password` changes the administrator's password and invalidates older sessions.

Submission notifications are in-app and can be marked read. `/admin/backups` supports protected database backup downloads and backup creation. Automatic backups run at startup and every six hours and retain 28 files. Restore is an offline server-owner operation; see OPERATIONS.md. Neither notifications nor backups imply any email delivery or off-device storage.

## Storage and security

Node 24.x provides SQLite. `RESULTS_DB_PATH` defaults to `private/results.sqlite`. The database holds users, hashed sessions, assignments, attempt progress, responses/results, answer keys, notifications, audit history and login throttles. Passwords use salted scrypt hashes. Private files and environment credentials are excluded from Git.

Mutation endpoints require same-origin JSON, authenticated roles, bounded payloads and owned attempts. Admin/candidate cookies are separate. On public HTTPS use secure production cookies; trusted classroom HTTP needs the documented explicit setting. Railway needs one instance, a persistent database volume and the exact public origin. Local database keys and results do not transfer automatically with deployment.
