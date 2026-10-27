# Reading recovery incident — 27 October 2026

Status: local reliability fixes implemented and verified; production deployment not performed. No production deployment, configuration change, real candidate submission, or database migration was performed for this investigation.

## Incident and evidence boundary

The owner reported six separate students taking Reading Test 1 on Railway, initially working normally, then individual recovery dialogs and finally five simultaneous failures. Supplied timestamps are 14:44:08–15:45:21 Dhaka (08:44:08–09:45:21 UTC). These are exam start/submission times, not an exact timestamp for each failure.

**The initiating client/network failure is not proven.** Initial CLI authentication was unavailable and browser inspection stopped because Computer Use could not confidently verify the URL. Read-only CLI access subsequently became available. Production HTTP logs, deployment metadata, nonsecret database-path configuration and incident-window resource metrics were then inspected. They confirm overlapping heartbeat-arrival gaps in five attempts while the sixth continued; they do not show resource exhaustion or HTTP 5xx responses. Browser/OS/network evidence is still needed to distinguish connectivity loss, renderer/timer suspension, and a stalled client request.

Read-only public evidence: the deployed homepage returned HTTP 200, and its public JavaScript recovery implementation was captured at 10:24:14 UTC. Relevant chunk: `/_next/static/chunks/2rzcs_easnjat.js`, 42,054 bytes, SHA-256 `ae60a9c02f0b74b21ca5e1a9b6db41b2eca79d7c0f4d1516be9cf1deee5b613d`. Its recovery behavior matches the important local defects below. Later Railway metadata identifies the active deployment as `e8a3e7f7-60a1-4f94-a13b-d949b179f253`, created 25 October 17:46:16 UTC from commit `0ca3adc765e8267cd64844f574b0b17c16131292`, matching the inspected local Git baseline. All retrieved incident HTTP records name that deployment. The capture's simple searches for `15000` and `5000` returned false because the deployed code uses minified numeric literals; that is **not** evidence the old timeout/poll were absent.

The supplied photo confirms a recovery dialog is visible; its small body text is insufficiently clear to identify a specific HTTP error.

## Production evidence actually obtained

Read-only queries covered 27 October **08:40?09:50 UTC / 14:40?15:50 Dhaka**. Seven separate ten-minute HTTP queries each returned fewer than the 5,000-record limit, with no parse/retrieval errors. Raw IP addresses and raw attempt identifiers were excluded from retained summaries. No production database answer rows were queried or changed.

- **8,946 available HTTP records:** 8,887 status 200, 12 status 206, 18 status 304, two 401, three 403, 22 status 404 and two 409. No 5xx was returned in these records.
- Both 401s were login requests around 14:43?14:44 Dhaka, rather than mid-exam session-validation failures. Three 403s were attempt-start requests around 15:45, near/after the reported submission time. The two 409s were section saves around 15:21 and 15:38; their response bodies were not retained, so an exact lease/section rejection reason cannot be asserted.
- Five attempts show overlapping long heartbeat-arrival gaps around **15:31:53?15:38:42 Dhaka**. Their largest individual gaps ranged from about 250 to 409 seconds; some had brief intermediate contacts. The sixth attempt's largest gap over the examined window was about 12 seconds. This closely supports the reported five-of-six pattern. It does not establish why those clients stopped delivering heartbeats.
- Available completed HTTP requests had a maximum duration of 3333 ms. Ten-minute-window p95 values were 19?43 ms. Requests that never reached Railway, and client-side response/body failures after an edge response, are not established by successful edge records.
- CPU: average 0.0099 vCPU, peak 0.0278 vCPU, configured limit 2 vCPU. Memory: average 353.6 MB, peak 356.8 MB, limit about 1024 MB. These sampled metrics do not support sustained CPU/RAM exhaustion during the incident; they cannot exclude every brief stall.
- Volume metrics peaked near 69.3 MB against 500 MB. A ready volume is mounted at **/data**; the configured results database is **/data/results.sqlite**. Classroom HTTP is disabled. No values of credentials or unrelated environment variables were printed or retained.
- The active deployment manifest specifies one replica; status reported one running deployment instance and application sleep disabled. The deployment list has no new deployment during the incident. The incident deployment-runtime log query completed successfully with zero returned events; this is an evidence limit, not proof that every possible process restart or error was absent.
- The 22 asset 404s concern **/hydration-attribute-cleanup.js**. That file already exists locally as an untracked earlier change. Its absence in the deployed artifact is a separate confirmed delivery discrepancy; there is no evidence it caused the recovery dialog. It was not modified or deployed in this task.

The strongest supported assessment is **client-side/request-delivery interruption affecting five attempts, amplified by the website's blocking/remounting recovery behavior**. There is no demonstrated SQLite lock or server-resource cause in the production evidence. The exact initiating client/network event remains unresolved; no browser trace or station-level network log was available. The logs also cannot prove the exact text of each photographed recovery dialog or recover unacknowledged historical answers.

## How the examination works

This describes the inspected local implementation. Railway reports the same baseline Git commit and the expected SQLite storage path; direct deployed-filesystem/database-content comparison was not performed. The new reliability changes remain local.

1. Login creates a candidate-specific hashed session in SQLite with a 12-hour expiry and an HttpOnly cookie. Assignments and attempts remain associated with that candidate, test, and mode.
2. Starting resolves or creates the assigned attempt. Instruction confirmation and activation start the Reading section and create its server deadline, 3,600 seconds later. Retrying does not issue a new deadline.
3. Answers live in React and in attempt/test/skill-scoped `sessionStorage`. Initial loading prefers an existing valid local snapshot over the server draft; saving waits for draft initialization.
4. Autosave checks every 250 ms, waits for 650 ms idle, and saves within five seconds during continuous editing. It sends a numbered answer snapshot, tab identity, candidate identity, and increasing revision.
5. Actual API handlers authenticate the cookie, verify candidate/assignment/attempt ownership, enforce the active section, tab lease, and answer window, then save inside the existing transaction and marking path. Existing revision checks reject older/equal revisions. SQLite uses WAL, foreign keys, a five-second busy timeout, and short synchronous `BEGIN IMMEDIATE` transactions.
6. Recovery renews the current tab's lease and publishes server lifecycle status. Temporary transport errors retain the current examination and local draft. Authentication and authorization failures still block access; retry exhaustion offers manual recovery.
7. Successful recovery flushes pending saves while preserving the mounted examination. Reading continues against the original deadline. Existing five-second final-save grace and automatic Reading-only finalization remain authoritative.

There is no server-wide answer object shared between candidates. Database queries inspected scope attempts to the authenticated student. This is supported by isolated cross-candidate HTTP denial and persisted-answer checks; it does not establish what happened to every production answer during the incident.

## Confirmed defects and supported changes

| Finding | Location | Severity and evidence | Change |
|---|---|---|---|
| Reading recovery blocked the whole screen on a single temporary heartbeat failure. Listening already had a limited exception. | `lib/results/TestSafety.tsx`, recovery effect | High. Confirmed source and deployed bundle; deterministic Reading interruption test reproduces the branch. A shared outage would independently put many students into this same modal. | Keep an established active examination mounted during retryable temporary failures; retain authorization blocks and a bounded exhaustion state. |
| A malformed successful HTTP response was classified as retryable by the request layer but immediately blocking by the recovery UI. | `lib/results/TestSafety.tsx`, recovery failure classification | Medium. Confirmed inconsistent branches; a malformed-200 response is exercised by the focused hook test. No proof it occurred in production. | Treat retryable response/body failures consistently during an established active exam, within the same finite retry budget. |
| Fixed-interval recovery callbacks could overlap and attach to the same pending attempt promise. The attempt map already deduplicated that request, so this was not proof of duplicate simultaneous start requests. | `TestSafety`, old five-second interval; `client.ts`, `ensureAttempt` | High. Confirmed callback overlap and inconsistent manual/automatic completion paths. | One completion-driven loop; manual clicks join its pending promise; button shows busy and releases after failure. |
| Successful automatic recovery changed a React container key and remounted the examination. | `TestSafety`, old recovery counter/container key | High. Confirmed source. This resets component-local UI/hooks and risks disrupting restoration; it does not prove answers were lost. | Remove the recovery-only remount. Emit the existing recovered event and preserve children. |
| Every normal renewal called attempt-start and then lease-claim, even with a known attempt. Start entered a write transaction unnecessarily. | `lib/results/client.ts`, `ensureAttempt` | Medium. Confirmed source; 20 concurrent callers now produce one claim and no start in a deterministic test. | Known attempts use the authenticated claim endpoint directly; initial starts still use the existing start path. |
| Autosave retried a failed snapshot on a fixed schedule indefinitely. | `client.ts`, `useDraftAutosave` | High. Confirmed source; bounded failure tests run actual coordinator code. | Serialize/coalesce snapshots, exponential backoff with jitter, 30-second cap, eight-failure retry rounds. Manual recovery/online can retry; fresh edits resume a transient paused save round. Terminal authorization errors do not resume merely through typing. |
| AbortController alone did not provide an independent completion deadline if a response/body promise ignored abort. | `client.ts`, `request` | Defensive reliability gap. Hung-body test demonstrates the old contract's weakness, not proof the production browser ignored abort. | Fifteen-second race covering request and body parsing, abort on expiry, retryable 408, finally clears timer. |
| A delayed lifecycle status could move the locally estimated countdown later. | `client.ts`, `useCountdown` | Medium. Confirmed calculation; server deadline itself was already fixed. | Keep the earliest established monotonic local due estimate. No change to server duration/grace. |
| `BEGIN IMMEDIATE` could throw before entering the transaction wrapper's error-handling block. | `lib/results/db.ts`, `transaction` | Medium. Confirmed source. | Include begin in try; rollback only when a transaction began; retain original exception; log busy/slow transactions. No PRAGMA/schema changes. |
| Errors lacked useful correlated privacy-safe incident telemetry. | `http.ts`, client and instrumentation | Medium. Confirmed inspection. | Correlated request IDs, safe error class/code, sampled/coalesced save/recovery events, busy 503 and Retry-After, periodic runtime metrics. No answer/name/token/body logging. |

These defects explain how a common transient failure can become a coordinated blocking recovery problem. The reported early successful retries are consistent with a request succeeding after a temporary failure. Repeated later failures would leave the old Reading interface blocked with ineffective-looking retries, but no incident response payloads were captured to distinguish a continuing outage from a stalled request. They do not identify the original common failure. A synchronous SQLite busy wait can block the Node event loop, but production lock evidence is missing; SQLite was not replaced or reconfigured.

## Files changed for this task

| File | Purpose |
|---|---|
| `lib/results/reliability.ts` (new) | Testable recovery/save coordinators, finite retry rounds, serialization and backoff. |
| `lib/results/client.ts` | Request deadline, cheaper renewal, scheduler integration, save telemetry and monotonic countdown estimate. |
| `lib/results/TestSafety.tsx` | Unified recovery/button path; preserve mounted exam; transient active-exam tolerance. Existing security/navigation controls remain. |
| `lib/results/client-diagnostics.ts` (new) | Bounded, coalesced best-effort browser telemetry. Storage/network failures are swallowed. |
| `lib/results/diagnostics.ts` (new) | Correlation, opaque attempt identifiers, suppression and sanitized error classification. |
| `lib/results/runtime-diagnostics.ts` (new) | Once-per-minute RSS/heap, CPU, event-loop delay and uptime logs; startup deployment/PID record. |
| `lib/results/http.ts` | Correlation response headers, sanitized errors and durations; SQLite busy responses use retryable 503. |
| `lib/results/db.ts` | Transaction failure handling and diagnostics only. |
| `instrumentation.ts` | Start runtime diagnostics alongside existing maintenance. |
| `app/api/attempts/start/route.ts` | Pass request context to the existing endpoint wrapper. |
| `app/api/attempts/[id]/lifecycle/route.ts` | Same context for GET/POST; lifecycle policy unchanged. |
| `app/api/attempts/[id]/draft/route.ts` | Same context for GET/PATCH. |
| `app/api/attempts/[id]/section/route.ts` | Same context for section saves. |
| `app/api/attempts/[id]/clock/route.ts` | Same context for clock requests. |
| `app/api/submissions/route.ts` | Same context for submissions. |
| `app/api/attempts/[id]/diagnostics/route.ts` (new) | Owned/authenticated, bounded telemetry batches; no database writes. |
| `scripts/verify-exam-client.cjs` (new) | Deterministic timer/hook tests using real client modules. |
| `scripts/reliability-fixture-server.cjs` (new) | Actual route-handler adapter with guarded disposable SQLite storage and test IPC controls. |
| `scripts/verify-exam-concurrency.cjs` (new) | Separate client contexts, cohorts 6/10/20/50, fault injection, persistence/deadline/integrity checks; optional actual Next HTTP server. |
| `AGENTS.md` | Update only the saving/recovery instructions to reflect this specifically authorized reliability change; preserve prior rules and generated block. |
| This report (new) | Evidence, limitations, verification and operating instructions. |

Other working-tree changes predated this incident work, including Student Portal/CMS, prior AGENTS additions, homepage, and user audio/image changes. They are not part of this reliability fix and must not be reset or silently deployed with it. No new package dependency was introduced.

## Verification

Tests use disposable databases and synthetic keys/candidates. The synthetic answer `A` is a fixture, not a change or validation of any real paper's key. Temporary records are removed by the harness after verification.

- TypeScript check: passed.
- Production build: passed on Next 16.4.3. The unrelated parent package-lock warning remains.
- Deterministic client/hook tests: ten groups passed, covering request single-flight, manual-click coalescing, finite retry rounds, latest-snapshot acknowledgement, held response-body timeout, nonblocking Reading recovery including an invalid-200 body, preserved draft/container through a seven-minute virtual outage, manual busy-state reset, stale countdown status, and diagnostic storage failure. These are VM/hook tests, not real-browser certification.
- Scoped lint: new coordinators, diagnostic modules, server/API changes and scripts pass. The two existing hook files retain four React-hook lint findings. Running lint against committed versions confirmed the same rule violations already existed; unrelated hook behavior was not refactored.
- Preservation baseline: 292 files checked, no missing files. Only the ten existing API/results files expected for this task changed within that baseline. All passage/question/rendering/media sources and `store.ts`, `scoring.ts`, `lifecycle.ts`, `auth.ts`, `assignments.ts` remained byte-identical. `instrumentation.ts` and new files are accounted for separately.
- Existing Student Portal: 19 service verification groups and 14 actual production HTTP groups passed.
- Existing Learning CMS: 16 service verification groups and 14 actual production HTTP groups passed.

Separate actual Next production HTTP scenarios against the rebuilt reliability source (each has independent disposable storage; the long soak was also running on this computer):

| Candidates | Seconds | Requests | Save acknowledgements | Recovery callbacks | Unexpected failures | p95 / p99 HTTP latency |
|---|---:|---:|---:|---:|---:|---|
| 6 | 60 | 222 | 114 | 11 | 0 | 220 / 5506 ms |
| 10 | 60 | 391 | 214 | 19 | 0 | 252 / 5387 ms |
| 20 | 60 | 762 | 414 | 39 | 0 | 399 / 5610 ms |
| 50 | 61 | 1886 | 1044 | 64 | 0 | 969 / 5784 ms |

A separate combined 86-candidate actual-Next HTTP run against the final build also passed for 60 seconds with zero unexpected failures, 86 verified persisted snapshots and SQLite integrity OK. The final malformed-response UI branch was separately exercised by the hook test. These shared-computer tests are not dedicated hardware capacity benchmarks.

Response-latency samples include injected SQLite contention. Intentionally aborted timeouts and immediate simulated network failures have no completed response latency and are counted separately. Recovery callback counts are events, not a count of distinct affected students or proof of identical failures in each cohort. Intentional faults/authorization denials are counted separately. The test exercised an actual HTTP response held for 16 seconds by a local fault proxy, which the client abandoned at 15 seconds, rapid edit bursts, stale-revision replay, simultaneous network interruption, session expiry and fixture-cookie replacement in the same VM context (not end-to-end browser reauthentication), cross-candidate denial, genuine SQLite write-lock contention, original deadline retention, persisted latest acknowledged answers and expected fixture raw scores. The separately tested cohorts contained 86 candidates in total; all stored snapshots were isolated; SQLite integrity and foreign keys passed. This short test did not reach natural submission.

The **70-minute real-time soak passed** from 2026-10-27T15:08:49.183Z to 2026-10-27T16:18:49.316Z: 4,200 seconds, with 86 simultaneous candidates across all four cohorts. Each examination retained its genuine 60-minute Reading deadline; observation continued for about ten minutes afterward. All **86 attempts completed**, all persisted snapshots matched their latest acknowledged answers, fixture raw scores matched independently counted wrong answers, original deadlines were unchanged, and SQLite integrity/foreign-key checks passed.

| Cohort | Requests | Save acknowledgements | Recovery callbacks | Unexpected failures | Completed |
|---|---:|---:|---:|---:|---:|
| 6 | 15,894 | 10,686 | 36 | 0 | 6 |
| 10 | 26,490 | 17,810 | 60 | 0 | 10 |
| 20 | 52,963 | 35,620 | 120 | 0 | 20 |
| 50 | 132,378 | 89,050 | 300 | 0 | 50 |

There were 227,725 requests and 153,166 acknowledged saves. Repeated shared interruptions were injected around minutes 12, 24, 36 and 48, in addition to the initial network/session/SQLite scenarios. Intentional fault observations are separate from unexpected failures. The long JSON latency percentiles use a bounded recent sample for larger cohorts, rather than an all-run latency archive.

The long soak used actual route handlers and separate client-module VM contexts behind a local HTTP adapter. It was **not a physical-browser or Railway load test**. It loaded the core save/request/recovery coordinators before the final best-effort diagnostic hardening and malformed-response UI classification refinement; those refinements were separately checked with focused tests and a fresh build. The hook test also advances through a seven-minute virtual outage, reaches a finite retry pause, and verifies manual recovery preserves the draft and mounted content. No claim is made that the production classroom interruption was reproduced byte for byte.

## Diagnostics and future incident collection

Search service logs for `IELTS_EVENT`. Events include `request-complete`, `request-rejected`, `session-validation-failed`, `database-busy`, `database-slow-transaction`, `server-exception`, `client-request-timeout`, `client-save-failure`, `client-recovery-failure`, `client-recovery-success`, `runtime-start` and `runtime-health`.

Use `requestId` from a failing API response/header to correlate browser and server events. Attempt references are truncated hashes, not student names. Repeated identical event/operation/status logs are suppressed for ten seconds and the next event reports a suppressed count. Save successes are sampled at 1%; browser events are coalesced into at most 16 kinds/status combinations, uploaded no more often than every 15 seconds after a batch, and the endpoint caps ten batches per minute per attempt. Metrics are process observations, not a substitute for Railway CPU/RAM/container/volume graphs. Browser logs are best effort and are neither an answer backup nor trusted proof of an incident.

For this incident, the HTTP/runtime queries, deployment metadata, storage configuration and CPU/RAM/volume metrics above were actually obtained after CLI authentication became available. Browser network traces, renderer/timer behavior and classroom connectivity evidence remain missing. A controlled nonproduction trial in the same classroom client/network should collect the exact failing request/error and timing before attributing the initiating cause. The retrieved requests identify the Electron classroom client; no desktop-application code was changed.

Sanitized evidence is retained in the private Codex workspace under `recovery-evidence/`: `railway-http-incident-summary.json`, `railway-incident-http-errors.json`, `railway-incident-metrics.json`, `railway-deployment-summary.json`, the local concurrency results and the preservation check. Auxiliary sanitizer scripts live there, outside the website. Do not publish these operational artifacts or export raw credentials/HAR files. No authentication dialogs or credential storage were automated.

## Remaining risks

- No initiating client/network event has been proven, and no production load/capacity certification or deployment validation was performed. A repeated shared infrastructure/network failure can still prevent server saves while it lasts; local answers do not make offline submission guaranteed.
- No physical classroom browser/fullscreen/audio soak was performed. Browser automation stopped because it could not verify the URL. The automated long run uses separate VM storage/cookies/client modules and actual routes, with a separate short Next framework test.
- SQLite remains a synchronous single-database design. The inspected configuration has a ready /data volume, a database path on it and one configured replica; live filesystem health and database contents were not directly inspected. Do not add replicas or migrate databases based on this report alone.
- Original deadline and final-save grace are unchanged. An outage lasting past that grace can leave the server's last acknowledged snapshot as the submitted result. This task does not authorize extending clocks, retroactively changing results, or reopening abandoned tests.
- Session expiry still requires authorized authentication. Recovery cannot override revoked assignments, another tab's lease or identity checks. The fixture replaces a session in the same client context; it does not certify browser login-navigation recovery. Existing new-document ownership restrictions can still require administrator assistance after reauthentication; they were not relaxed.
- General browser/storage/device failures and loss of the tab cannot guarantee preservation of unsaved local work. No claim is made about unrecovered historical incident answers.

## Safe deployment and rollback — instructions only

1. Obtain deployment approval and choose a maintenance window with no active examination. Do not deploy or restart during a live test.
2. Retain the deployment ID/commit, service configuration, volume mount and database path recorded above; verify they are still current at release time. Review the collected incident evidence and obtain the missing client-side evidence where possible.
3. Use the existing authenticated admin backup function for an online SQLite backup; download it to protected storage and verify its integrity. Also preserve independent media backups. A raw copy of a live database file without WAL coordination is not an adequate backup. Do not put backups or keys in Git/public.
4. Establish the source baseline of the actual live deployment before preparing the release; a local Git HEAD is not proof of the uploaded deployment contents. Preserve exact already-deployed Portal/CMS features if they were deployed from uncommitted source. If that baseline cannot be established, do not deploy yet. Apply a reviewed commit containing this report and the explicitly listed reliability source/test files to that verified baseline. This working tree contains unrelated Portal/CMS and media changes: inspect the staged diff and dependencies; do not use a blanket `git add .` or upload the entire tree.
5. Keep existing environment, mounted volume, database path, cookie security, assignment rules and replica topology. Build/start the reviewed source using the existing Node 24 / package-lock setup. No migration or new dependency is required by this fix.
6. First validate on a nonproduction deployment with disposable accounts/keys and a separate volume/database. Run client tests and short actual-Next HTTP cohorts; perform real-browser login, Reading navigation, save-status check, brief network interruption/recovery and a genuine deadline run. Verify unaffected Listening/Writing security and audio behavior with approved fixtures.
7. After approval, deploy in the maintenance window. Check health, new runtime-start/health logs, private data paths and small supervised disposable tests before a real classroom examination. Inspect failure and latency patterns rather than treating a successful homepage load as sufficient.
8. If regression occurs, stop starting new tests and retain diagnostics. Roll application source/deployment back to the recorded known-good version while retaining the same volume/database. No database rollback should be needed because this fix changes no schema or marking data. Do not restore an old backup over newer student answers merely to roll back code.
9. If database restoration becomes independently necessary, obtain explicit approval, stop all writers cleanly, and follow the existing restore procedure. It clears sessions and replaces records, so it is not a routine application rollback. Preserve the current database first and never delete WAL/SHM to bypass restore guards.

Reproduction commands (local disposable tests only): `node scripts/verify-exam-client.cjs`; `IELTS_TEST_NEXT=1` with `IELTS_SOAK_MINUTES=1` for the framework test; `IELTS_SOAK_MINUTES=70` for the real-time route-handler soak. Set `IELTS_REPORT_PATH` to a private local JSON artifact location. In PowerShell use `$env:NAME='value'` on separate lines before the Node command. Do not aim these harnesses at production storage.
