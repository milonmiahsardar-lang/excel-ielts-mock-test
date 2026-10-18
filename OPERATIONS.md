# IELTS website operations

## Classroom tests without internet

The candidate computers and the host computer still need a working local network (router, Wi-Fi or Ethernet). Internet is not needed after installation and setup; disconnecting a candidate from the router also disconnects them from the test server.

Use Node 24.x. For an exam session, build once with `npm run build`, then run `npm run start -- --hostname 0.0.0.0 --port 3000`. Build before students arrive. Keep the host awake, plugged in, and connected throughout all sections. Reserve the host's LAN address on your router so it does not change during exams. Allow the app through Windows Firewall on the private classroom network only.

For production mode over plain classroom HTTP, set `CLASSROOM_HTTP=true` in the host environment. This is only for a trusted classroom network; do not use it on Railway or on a public network. For development, `npm run dev -- --hostname 0.0.0.0` uses ordinary local cookies automatically.

Candidates visit `http://<host-LAN-IP>:3000`. They must not use `localhost` on their own computers. Leave `APP_ORIGIN` unset for classroom use so the incoming host and port are checked, or set it to the exact address every candidate uses. An explicit origin for a different address will reject login requests.

## Accounts, assignments and interrupted tests

Create students and assign tests in the Admin Portal. Clicking a test requires candidate credentials. Reassigning the same test creates a fresh attempt and preserves prior submissions. Reassignment or revocation of an unfinished attempt asks for confirmation because it ends that attempt's access.

An unfinished test cannot be reopened after a refresh, a new tab, leaving the test, or a browser restart. The same open tab may recover its expired connection lease after a temporary server/network interruption; the section's server clock continues. Administrators must reassign abandoned tests. Assignment expiry is a deadline for starting; it does not terminate a test already started. Revocation does terminate access.

Candidate password reset is on the candidate edit page. It invalidates existing login sessions and is blocked while an unfinished test has an active lease. End/reassign the attempt before resetting its password. Admins can change their own password at `/admin/password`.

If the admin cannot sign in, stop the server and provide `ADMIN_USERNAME` and `ADMIN_RESET_PASSWORD` securely in that process's environment, then run `npm run reset-admin`. Do not put a password into command arguments or commit it. Remove the reset variable afterward and restart. `ADMIN_PASSWORD` only creates an initial administrator; changing it does not change an existing account's password.

## Test readiness and scoring

`/admin/system` lists the presence of both approved 40-question answer keys and `public/audio/listening-test-N.mp3`. Full tests cannot start until those assets exist. This check does not prove the recording matches the questions; verify that separately. Local Tests 1–10 passed the asset/key readiness check in this work. Tests 11–20 still need the keys/audio previously requested; add approved materials when available.

Keys are private database records. Existing Tests 1–10 keys and all test content were preserved in this phase. Scoring respects configured alternatives, word limits and unordered answer groups. Saving an amended approved key rescores unreleased submissions; already released grades stay unchanged. Draft keys do not erase grades. Reading and Listening bands are mock-test estimates; Writing needs instructor marking. There is no Speaking score or official four-skill IELTS band.

## Backups and restoration

`/admin/backups` lists backups, supports a manual backup, and downloads files only for authenticated administrators. Automatic SQLite backups run at server startup and every six hours while the server is running. The latest 28 are retained. Integrity is checked before an automatic/manual portal backup is published. A backup includes accounts, keys, results, assignments and sessions, but not MP3 files, images, source code or environment files.

Keep backups outside `public`. `BACKUP_DIR` defaults to a `backups` directory beside `RESULTS_DB_PATH`. Download copies to another device: backups on the same disk cannot protect against disk failure. Frequent server restarts also create backups and may shorten the history covered by the 28-file retention limit.

For a command-line database backup, run `npm run backup` with the correct database path environment. To restore, stop the server cleanly, then run `npm run restore -- "<absolute-backup-path>" --confirm-restore` using the intended `RESULTS_DB_PATH`. The restore script refuses a target with SQLite WAL/SHM files still present. Do not delete those files to bypass this check; stop/checkpoint the database correctly first. It checks backup integrity and required tables, keeps the old database beside the target, and clears restored sessions so everyone must log in again. A restoration test passed using disposable fixture data only. No real database was restored or password reset by this work.

## Railway deployment checklist

This phase has not deployed or changed the live Railway service.

- Use Node 24.x, `npm run build`, then `npm run start -- --hostname 0.0.0.0 --port $PORT`.
- Attach a persistent volume; set `RESULTS_DB_PATH` inside its mount (for example `/data/results.sqlite` when `/data` is the actual mount). The app checks Railway's volume mount variable before opening its database.
- Keep one application replica with this SQLite implementation; separate replicas must not have unrelated databases.
- Set `APP_ORIGIN` to the exact public HTTPS origin candidates use, without a path. Do not enable `CLASSROOM_HTTP`.
- Transfer/configure approved keys securely. Only Test 1 has a built-in seed; local database keys are not automatically copied by Git deployment.
- Include the required public audio/image assets. Put database backups on the persistent volume and retain independent downloaded copies.
- Test login, assignment, submission and admin results after deployment. Check logs for volume/origin/backup errors. A local verification does not verify Railway's live configuration.

## Admin result tools

Results are filtered in the database and shown 25 per page. Previous/Next preserve filters. CSV exports matching results and protects spreadsheet cells that begin with formula characters. Backups and CSVs contain private candidate information; store them privately.

`/admin/notifications` shows submission events and lets admins mark them read. Notifications are in-app only, not email/SMS. The test toolbar's existing Notes, Connection, Notifications and Menu buttons now open functional panels. Notes remain private to the attempt's browser tab and are not marked or backed up. Connection checks the classroom server, not internet access.

## Classroom trial before an exam

Use disposable candidates, not existing submitted records.

1. From two classroom computers, open the host LAN URL and sign in to separately assigned ready tests.
2. Check candidate A cannot open candidate B's result or admin pages.
3. Play the full audio; confirm Reading stays locked until it finishes. Confirm the Reading/Writing server timers run correctly.
4. Type answers, highlight/unhighlight text and use Notes/Connection. Check text remains readable and questions keep their original layout.
5. Briefly disconnect/reconnect one candidate while keeping its tab open; verify saved answers and recovery, with the timer continuing.
6. Leave/refresh a disposable unfinished attempt; verify it cannot resume. Confirm admin reassignment starts a clean attempt and warns before interruption.
7. Complete the test; verify the Thank You page followed by logout, all saved responses, Listening/Reading grades and Writing awaiting marking.
8. Mark/release the result, reassign the same test and verify the previous submission remains visible to its owner.
9. Download a database backup and CSV. Check readiness for every test you intend to assign.

The physical two-computer trial and a real full-length exam remain necessary: automated isolated checks cannot verify classroom Wi-Fi, firewall, sleep settings, power, browser versions or full audio playback.


## Section instructions and completion screens

The section dashboard is at `/listening/instructions?test=N` for the whole mock. Students confirm the instructions, then explicitly start each section. Reading and Writing each receive 60 minutes beginning at Start, not while instructions are displayed. Listening/Reading completion saves the final eligible snapshot before showing a section-ended screen; Continue opens the next instructions. Missing videos do not prevent starting: written instructions remain available.

Optional shared instruction videos: `public/videos/listening-instructions.mp4`, `public/videos/reading-instructions.mp4`, `public/videos/writing-instructions.mp4`. Add videos before loading the dashboard; hosted public assets require redeployment.

Section preparation state uses three additive columns in attempt_progress. Existing active attempts keep their stage/deadline. Server confirmation, ownership, lease, production timing and no-resume guards remain enforced. Development mode still permits early section completion for previews. Final submission keeps the thank-you page and automatic logout.
