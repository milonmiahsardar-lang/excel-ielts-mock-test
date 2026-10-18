# Website fixes: verification record

Date: 9 October 2026. This phase completed the unfinished reliability/administration work. No deployment was made.

## Completed

- Reassignment/revocation confirms interruption of an unfinished attempt. Reassigning the same test preserves previous results and creates a fresh attempt.
- Both start and lease-claim enforce no resumption of an unfinished attempt from another tab/refresh. Same open-tab recovery can renew an expired lease. Starting after assignment expiry is blocked; an already started attempt can continue.
- Submitted-result ownership does not depend on the current assignment. Candidate history lists previous submissions.
- Ready full tests require two approved 40-question keys and audio. Admin readiness page identifies missing assets.
- Automatic SQLite backups at startup/every six hours, 28-file retention, integrity validation, admin-only manual backups/downloads, offline restore retaining the previous database and clearing sessions.
- Candidate/admin password controls and server-owner recovery script. Candidate reset blocks active test leases; reset invalidates sessions.
- In-app submission notifications, database-filtered result pagination and protected CSV exports.
- Existing toolbar Notes, Connection, Notifications and Menu panels; private per-attempt tab notes, save status and server connection check. Modal keyboard focus is contained.
- Highlighting fallback for browsers without the native Highlight API; same yellow color and no rewriting of React's question text.
- Classroom HTTP opt-in for production, explicit public origin configuration and Railway volume checks. Documentation in OPERATIONS.md.

## Verification performed

Isolated disposable databases/accounts were used for mutations and restore. No real candidate password, result, assignment or answer key was changed in this phase.

- TypeScript validation passed after the implementation edits.
- The optimized production build passed. Runtime database/backup paths were excluded from asset tracing; the final build reported no tracing warnings.
- Server tests passed: classroom origin/role checks, same-tab lease recovery, new-tab refusal, expiry, reassignment/revocation, old-result ownership, password resets, readiness for Tests 1-10, filters/pagination, protected CSV and notification handling.
- Backup integrity, coalesced concurrent backups, protected downloads, traversal rejection, public-folder rejection and restoring results with sessions cleared passed. Restore also correctly refused an open target.
- Existing scoring regression checks passed for 800 primary answers, 1,040 accepted variants, unordered groups, deadlines/retries and released-grade preservation. These are scoring checks, not a new source/audio verification.
- Browser checks passed for fixture admin/candidate login, results Previous/Next, readiness page, manual backup, Notes, Connection, highlighting and interrupted-attempt access messaging. The original test layout stayed visible and readable.
- File hashes match the pre-phase snapshot for all test renderers/content, public audio/images and private seeds. All 20 real answer key records match their approved pre-phase copies.

## Still needs user/environment input

- Approved Listening/Reading keys for Tests 11-20 and remaining audio, as previously deferred by the user.
- Physical classroom trial on separate computers, including a full-length attempt, Wi-Fi/firewall/power and audio checks.
- Railway deployment/configuration verification; the live service was not accessed or changed.
- A final production-server HTTP smoke check could not run: automatic approval review rejected the server launch because shell approval was required but unavailable. The browser checks above ran against the isolated development server; classroom HTTP cookie behavior passed the isolated server-module checks.

Browser highlighting fallback was reviewed in code; the browser trial exercised the native Highlight API. Verify older candidate browsers during the classroom trial.
