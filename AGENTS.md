**MANDATORY PROJECT INSTRUCTIONS: Before modifying this project or adding any Listening, Reading, or Writing test, read and follow this entire AGENTS.md file. Preserve the existing website's interface, functionality, settings, architecture, and test mechanisms. Do not introduce unrequested changes. When these instructions conflict with a new user request, ask for clarification rather than silently changing established behaviour.**

# Excel Institute IELTS website: permanent project rulebook

Source inspection baseline: 25 October 2026. This document records local implementation, not certification of every feature in a browser. Re-read relevant source before changing it. Current explicit user instructions and actual implementation take precedence over assumptions and older prose documentation; explain conflicts rather than silently changing behaviour. Higher-priority runtime instructions still apply.

## 1. Scope, consent and preservation

- Owner restriction (27 October 2026): Mock test sections and the mechanisms of the entire website are frozen. Do not change their content, interface, styles, settings, interactions or underlying behaviour as part of future additions or unrelated work. If a future request requires changing a protected section or mechanism, explain the conflict and obtain explicit consent for that specific change before editing.

- Website root: `C:/Users/Asus/Desktop/ielts-reading`. These rules apply throughout it.
- The desktop application at `C:/Users/Asus/Documents/Codex/IELTS-Offline-App` is a separate project. Website work does not authorize changing/rebuilding the app, and app work does not authorize changing this website.
- Preserve everything that works. New tests must use the existing design, architecture and mechanisms, differing only in their approved content.
- Work only on the named test, module, question range or feature. A screenshot of one matching group does not authorize changing other tests or question types.
- Do not incidentally change fonts, colours, field sizes/borders, layouts, headers/footers, icons, spacing, timers, settings, security, APIs, keys, database schema or deployment.
- Preserve passage and question wording. Report ambiguity first. Correct spelling, grammar or transcription only when requested/approved. Do not invent replacement questions/options to make a key fit without explicit approval for that content change.
- Verification/audit requests are read-only until corrections are approved. Do not search online when local-only verification is requested.
- If a shared mechanism must change, explain why, identify affected screens and propose the smallest change. Obtain approval before a potentially breaking change or work outside scope. Do not repeatedly ask for permission for steps already authorized.
- Start with `git status --short`. Preserve unrelated tracked/untracked changes; never reset or overwrite them. Search with `rg`/`rg --files` and reuse before creating.
- Do not add dependencies, frameworks, design systems, duplicated shells or unrelated refactors without approval.
- Do not run migrations, seed/reset/restore scripts, create candidates or submit real attempts merely to inspect/document the project.
- For documentation-only requests, change only documentation. Preserve the Next.js-generated block at the end of this file.

## 2. Architecture and implementation map

The site uses Next.js App Router, React, strict TypeScript, Tailwind CSS v4, `lucide-react` and Node's built-in SQLite. Current `package.json`: Node `24.x`, Next `16.4.1`, React/React DOM `19.2.9`. Do not upgrade these during content work. `tsconfig.json` uses bundler resolution, JSON imports and `@/*` mapped to the project root.

| Area | Source of truth |
| --- | --- |
| Homepage and banner | `app/page.tsx`, `app/HomepageBanner.tsx`, `app/homepage.module.css` |
| Global layout/styles | `app/layout.tsx`, `app/globals.css` |
| Candidate login/dashboard | `app/verify/page.tsx`, `app/verify/VerifyClient.tsx`, `app/candidate/page.tsx` |
| Ready confirmation | `app/confirm/page.tsx`, `app/confirm/TestClient.tsx`, `app/confirm/layout.tsx` |
| All section instructions/completion screens | `app/listening/instructions/page.tsx`, `app/listening/instructions/TestClient.tsx` |
| Listening shell/player | `app/listening/page.tsx`, `app/listening/TestClient.tsx` |
| Reading shell/dispatch | `app/test/page.tsx`, `app/test/TestClient.tsx` |
| Writing/editor/prompts | `app/test/writing/page.tsx`, `WritingTestClient.tsx`, `writing-prompts.ts` in that directory |
| Result/signout | `app/test/writing/result/page.tsx`, `SubmissionLogout.tsx` in that directory |
| Highlighting | `app/test/layout.tsx`, `app/listening/layout.tsx`, `lib/highlighting/TestHighlighter.tsx`, `lib/highlighting/ranges.ts` |
| Browser saves/timers | `lib/results/client.ts` |
| Browser lifecycle/fullscreen | `lib/results/safety-client.ts`, `TestSafety.tsx`, `TestTools.tsx` in that directory |
| Server lifecycle/access | `lib/results/lifecycle.ts`, `TestAccess.tsx`, `assignments.ts` |
| Persistence/marking | `lib/results/db.ts`, `store.ts`, `types.ts`, `scoring.ts` |
| Candidate/assignment rules | `lib/results/candidates.ts`, `assignment-login.ts`, `modes.ts`, `assessment-purpose.ts`, `exposure.ts`, `exposure-history.ts` |
| Auth/HTTP/readiness/audio validation | `lib/results/auth.ts`, `http.ts`, `readiness.ts`, `audio-duration.ts` |
| Startup/deadline recovery/backups | `instrumentation.ts`, `lib/results/maintenance.ts`, `scripts/backup.mjs`, `scripts/restore.mjs` |
| Private runtime storage | `private/` by default; `RESULTS_DB_PATH` can override it |
| Media | `public/audio/`, `public/images/`, `public/videos/` |

Read relevant installed framework documentation in `node_modules/next/dist/docs/` before changing framework integration. Do not assume older Next.js APIs: route `params`, `searchParams` and `cookies()` are asynchronous here. `.next/`, generated types, `node_modules/` and `.bak` files are not editable templates. `app/review/page.tsx` redirects to `/`; it is not a candidate answer-review feature.

## 3. Preserve the interface

- Test screens explicitly use Arial/sans-serif, white surfaces and black text. Global body uses Arial/Helvetica/sans-serif. Root Geist variables do not authorize changing test fonts.
- Preserve component-specific colours: homepage maroon `#780c25`, test branding `#e31837`, answer/focus blue `#2185d0`, strip background `#f2f2ef`, and existing grey borders. Do not impose one global redesign.
- Keep headers, timer appearance, toolbar icons/aria-labels, buttons, footer navigation and responsive breakpoints. Reading headers commonly use 56px; Listening/Writing use 60px.
- Field variants are intentional: ordinary Reading inline fields use `h-8 w-36`; `SummaryGap` has a 34px dashed rounded field with number placeholder; common Listening fields use `h-9 w-44`. Never resize, recolour or restyle fields to fix surrounding text.
- Reading passage/questions scroll independently; divider defaults to 50/50 and is constrained to 25%-75%. Preserve pointer capture, ArrowLeft/ArrowRight steps of 2 percentage points, accessible separator attributes and overflow/min-size classes.
- Writing stacks panels below `lg` and uses a resizable three-column layout at `lg`. Do not silently apply that design to Reading.
- `app/test/PartNavigation.tsx` serves both modules. Reading uses `floating` zero-height navigation with absolute arrows above its footer; Listening uses the ordinary flow version. Do not restore a large blank arrow row above Reading's footer.
- `app/globals.css` overrides `[data-ielts-test-footer]`: minimum 64px height, 16px navigation text, minimum button dimensions 28px by 32px. Inspect final global plus local styles.
- Preserve `data-ielts-test-content`, `data-ielts-test-footer`, `data-ielts-zoom`, `question-N` anchors and accessible labels. Safety, scrolling, highlighting and zoom depend on them.
- `TestTools` Menu offers Small/Standard/Large at 90/100/125 percent. It changes scrolling content, not fixed exam controls. Preserve it instead of adding browser zoom.
- Existing test-specific boxes, real bullets, headings, dropdown columns and radio/checkbox alignment live in scoped renderer branches. Reuse the nearest pattern; do not broaden its scope without approval.
- Preserve Listening MCQ style. Adding a box/bullets to notes does not authorize changing MCQs. Do not add drag-and-drop to existing Listening dropdown matching.
- Root `next/script` loads `public/hydration-attribute-cleanup.js` with `beforeInteractive`. It removes only observed extension bookkeeping attributes (`bis_skin_checked`, `bis_register`, UUID-shaped `__processed_...__`). Do not replace it with blanket warning suppression or general attribute removal.

## 4. Test catalog and templates

There are currently IDs 1-20. Limits occur in homepage generation, renderer dispatches, `http.testId`, `TestAccess`, Writing validation, audio mapping, admin selectors and database CHECK constraints. Test 21+ requires a coordinated capability change with approval, not merely another JSON file. Never reuse an occupied ID or fall back silently to Test 1.

### Reading

| IDs | Actual renderer/data |
| --- | --- |
| 1 | `app/test/TestClient.tsx` hosts `TestOneReading.tsx` passage/question panes |
| 2-6 | `TestTwoReading.tsx` through `TestSixReading.tsx`; `test2-reading-data.ts` through `test6-reading-data.ts` |
| 7-10 | `ImportedReadingTests.tsx`, `imported-reading-types.ts`, `testN-import.json` |
| 11-15 | `ReadingTestsElevenToFifteen.tsx`, `reading11-15-types.ts`, `testN-import.json` |
| 16-20 | `ReadingTestsSixteenToTwenty.tsx`, `reading16-20-types.ts`, `testN-import.json` |

Reading has three passages and 40 questions. Use actual passage `start`/`end`; ranges differ between tests.

Imported data: `{number,passages:[{title,paragraphs:string[],start,end,groups:ReadingQuestionGroup[]}]}`. Labelled paragraphs use `"A\nText..."`, recognised by the uppercase-letter/newline renderer pattern. Unlabelled introductions are allowed; preserve labels needed by matching tasks.

Supported groups depend on the target type file and renderer:

- Base: `title`, `instructions:string[]`, optional `heading`.
- `choice`: numbered `questions` with `prompt` and `options:string[]`.
- `truth`: numbered questions and `labels:string[]`; preserve YES/NO/NOT GIVEN versus TRUE/FALSE/NOT GIVEN.
- `match`: numbered questions, `options:[{label,text}]`, optional `optionTitle`/`examples`.
- `fill`: `paragraphs`, optional `shortAnswers`; later schemas support labelled summary options.
- `multiple`: `questions:[{numbers:number[],prompt,options:string[]}]`; separate numbered slots store selections.
- `table`: `columns` and `rows`; `diagram`: `image`, `numbers`, with `alt` in the 16-20 schema.
- `flow` is supported by the 16-20 schema/renderer; do not assume it is supported by earlier schemas.
- Rich text uses `{{N}}` for blanks, `**...**` for bold and newlines. Do not duplicate input numbers with manually printed prefixes.

Reuse `HeadingBank`, `HeadingDrop` and `headingQuestion` from `HeadingDragAndDrop.tsx`; `ParagraphInformationTable.tsx`; `SentenceEndings.tsx`; `SummaryWithClues.tsx`; `SummaryWithoutClues.tsx` and `SummaryGap`. Headings store labels/Roman numerals in passage drop slots. Paragraph information uses the letter table. Sentence endings and summary clues support drag/drop and select-then-place with existing swap/reuse rules. Preserve their interactions.

`reading-option-values.ts` deliberately converts only listed legacy questions. Current entries: Test 11 Q33-35; Test 14 Q13,25,26; Test 15 Q18-22,37-40; Test 16 Q12-14; Test 17 Q14-18,24-26,36-40. Some mapped numbers are not currently MCQs; the mapping is not universal.

Known legacy exceptions: Test 18 Q31-32, Test 19 Q11-13 and Test 20 Q7-10 save full option text, and their active keys also accept text. The owner accepted these tests' answers. Documentation is not authorization to migrate them. For new approved letter-based choices, save letters and make keys agree; use `normalizeReadingOption` for restored legacy drafts when applicable. Never change only the key or only the control format.

### Listening

`app/listening/TestClient.tsx` owns answers, player, timing, four-part navigation and dispatch. Content components receive `{part,answers,updateAnswer}`; grouped renderers also receive `testNumber`. Do not create a player/timer in content components.

| IDs | Renderer |
| --- | --- |
| 1 | Inline content in `app/listening/TestClient.tsx` |
| 2-11 | `TestTwoListening.tsx` through `TestElevenListening.tsx` |
| 12,16 | `ListeningTestsTwelveSixteen.tsx` |
| 13,19 | `ListeningTestsThirteenNineteen.tsx` |
| 14,17,20 | `ListeningTestsFourteenSeventeenTwenty.tsx` |
| 15,18 | `ListeningTestsFifteenEighteen.tsx` |

Tests 12-20 use `app/listening/listening-test-N.json`: `{number,parts:Group[][]}` with four parts. Fields include `title`, `type`, `instruction`, `limit`, `heading`, `box`, `paragraphs`, `columns`, `rows`, `questions`, `options`, `numbers`, `prompt`, `image`, `viewBox`, image dimensions and `alt` where supported.

Existing types include fill, table, choice, multiple, match, map, selectflow, flow and specialised paperflow. Some flow/paperflow content is hardcoded in its renderer. A type string/cast does not prove general support. Rich text follows the renderer's blank/bold/newline parser. The 12/16 renderer additionally supports `{{N:0}}`/`{{N:1}}` paired blanks joined as `" / "` in one stored answer; preserve that key contract.

Text answers are strings; matching/map dropdowns store labels; common radio/checkbox components store letters. Keep selection limits and unordered key groups consistent. Audio is `public/audio/listening-test-N.mp3`; all 1-20 files existed at inspection, but presence is not recording/content verification. Shared optional instruction videos are `public/videos/listening-instructions.mp4`, `reading-instructions.mp4`, `writing-instructions.mp4`. Never overwrite another test's media.

### Writing

Use `app/test/writing/WritingTestClient.tsx` and `writingPrompts[testNumber-1]` in `writing-prompts.ts`. Each entry has `task1:{title,prompt,instruction,image:{src,alt,width,height}}` and `task2:{title,prompt,instruction}`. Preserve index/ID correspondence and real asset dimensions/alt text.

Keep Task 1/2 tabs, footer navigation, prompt/editor panes, divider, plain controlled textarea and live whitespace-based word counter. Both texts save regardless of active task. Task 1 instructs 150+ words/about 20 minutes; Task 2 250+ words/about 40 minutes. These are instructions within ONE 60-minute section, not separate timers or enforced minimum-word submission gates.

The editor disables spellcheck, autocorrect, autocomplete and Grammarly attributes. There is no rich-text editor or AI marking. Do not add editor features without approval.

## 5. Timing, audio and lifecycle invariants

`lib/results/lifecycle.ts` is authoritative. Stages: `NOT_STARTED`, `LISTENING_ACTIVE`, `LISTENING_COMPLETED`, `READING_ACTIVE`, `READING_COMPLETED`, `WRITING_ACTIVE`, `COMPLETED`. Pending sections/instruction/completion flags control transitions.

- Modes are `full`, `listening`, `reading`, `writing` in `modes.ts`. Full mocks progress Listening -> Reading -> Writing; module-only assignments use only their included section. Reuse `modeOf`, `includesModule`, `firstModule`, `modePath`.
- Confirmation requests fullscreen and begins an attempt; section time starts only after instruction confirmation and Start/`activate`. `/listening/instructions` handles every section/mode, not just Listening.
- Preserve distinct `confirm-instructions`, `acknowledge-completion` and `activate` actions. Retried Start must not reset a clock.
- Reading/Writing each get server deadline `Date.now()+3600000`. `useCountdown` uses deadline/serverNow and `performance.now()`, ticking once per second. Changing passages/tasks does not restart time.
- Listening follows actual recording length, not a new 30-minute clock. `recordingDuration()` parses MP3 frames server-side including VBR and caches by mtime. Development-only missing-file fallback is 30 minutes; production rejects missing/invalid recordings.
- The hidden native player has no normal controls, auto-plays after draft readiness, enforces rate 1 and prevents seeking ahead. Preserve its header elapsed/duration/progress and explicit Play recovery when autoplay is blocked.
- Progress reports occur roughly every 3 seconds; server validates elapsed time with a 2-second tolerance. Completion requires an ended report and verified progress within 1 second of real duration. Client metadata or forged ended events cannot unlock Reading.
- Listening end freezes a final answers/revision snapshot and retries failed completion reports. Temporary network/timeouts/5xx must not unnecessarily unmount/pause healthy playback. Auth/lease/progress rejections remain authoritative.
- Production prevents early Listening/Reading advancement. Full-mock development preview exceptions exist; do not extend them to production.
- `TestSafety` emits `ielts:deadline`, disables input/select/textarea controls and retries final Listening/Reading saves. The server has a 5-second final-save grace; revision numbers do not extend it.
- Writing `finishTest()` requires readiness and `timeLeft===0`; it automatically submits at expiry and retries retryable failures every 5 seconds/online. The server rejects early Writing submission. There is no general early/manual Finish button in the current UI; an expiry retry is not early submission.
- Maintenance finalises expired Writing and Reading-only attempts from server drafts every 5 seconds, respecting the grace and assignment checks. Do not claim equivalent offline Listening finalisation.
- Completion is idempotent, stores one submission, consumes only its assignment and clears its lease. Result route is `/test/writing/result?id=...&signout=1`. Preserve thank-you, immediate signout and automatic role-safe logout after 5 seconds.

## 6. Saving, recovery and cross-test isolation

Reuse `request`, `useAnswerDraft`, `useDraftAutosave`, `resumeDraft`, `saveSection`, `saveWritingDraft`, `ensureAttempt` and `lifecycle`, not parallel persistence.

- Client answers: `Record<number,string>`; server `Answers`: `Record<string,string>` for 1-40. Writing: `{task1:string,task2:string}`.
- Draft loading leaves content inert until ready and prefers valid local snapshots over server drafts. Do not autosave an empty initial render over restored work.
- Autosave updates sessionStorage, checks every 250ms and saves after 650ms idle or within 5 seconds despite continuous typing. It serialises/coalesces in-flight saves, uses bounded exponential backoff with jitter (30-second cap, eight-failure rounds), and flushes on online/deadline/recovery. Explicit retry or fresh edits can resume a transient paused save round; typing does not override terminal authorization errors. Do not substitute an indefinitely postponed debounce.
- `draftRevision`/`acceptDraftRevision` order snapshots. Only server time determines eligibility; late/stale responses must not erase newer content.
- `request` has an independent 15-second timeout covering fetch and body parsing, and sends `X-IELTS-Tab` plus applicable candidate identity. Preserve save-status events and local answers on failure.
- The specifically authorized 27 October recovery fix uses one completion-driven renewal loop and one manual retry path. Known attempts claim their lease without restarting the attempt. Temporary failures preserve an established active examination; authorization failures and exhausted retry rounds can block it. Recovery must preserve the mounted examination and its original server deadline. See `RECOVERY-INCIDENT-2026-10-27.md` for evidence and limitations. This incident authorization does not relax the owner's freeze for unrelated future work.
- Unload/visibility handlers attempt bounded keepalive saves. This is not guaranteed offline submission or authorization to resume an abandoned test in another tab.

Storage contracts:

| Key | Purpose |
| --- | --- |
| `ieltsStudent` | Candidate ID; switching candidates clears existing `ielts*` session keys |
| `ieltsAttempt:N`, `ieltsMode:N` | Test-specific attempt ID and mode |
| `ieltsDraft:ATTEMPT:N:SKILL` | Draft; related suffixes store revision/deadline/audio time |
| `ieltsReloadOwner` | Tab owner token |
| `ieltsProtectedAttempt`, `ieltsActiveTest` | Protected navigation/current test state |
| `ieltsNotes:ATTEMPT:N` | Private, unmarked tab notes |
| `ieltsZoom:ATTEMPT:N` | Content-size preference |
| `ieltsHighlights:v1:CANDIDATE:ATTEMPT:N:SECTION` | Local annotations |
| `ieltsAudioDiagnostics:ATTEMPT` | Bounded pending diagnostic events |

Older compatibility keys also exist in individual components; do not make them the new authority or casually delete them. Every read/write must preserve candidate, attempt, test, mode and skill ownership. Completing one test must never complete/lock another. Full and single-module assignments are separate. Preserve all candidate history on additions/reassignment.

## 7. Authentication, access, fullscreen and exposure

- `auth.ts`: scrypt hashes, random tokens stored as SHA-256 hashes, 12-hour HttpOnly SameSite=Lax cookies. Admin/candidate cookies are separate (`ielts_admin_session`, `ielts_candidate_session`) with role-checked legacy compatibility.
- `ADMIN_USERNAME`/`ADMIN_PASSWORD` bootstrap an initial administrator only. Never expose their values. Resetting an existing password is a separately authorized operation.
- Login limits: 10 failed attempts, 15-minute lock period. Preserve roles and private admin endpoints.
- `TestAccess.accessError`, `assignmentFor` and `authorizeAttempt` validate test/mode, assignment, expiry, allowance, current section and attempt ownership. URL parameters do not grant access; candidate identity comes from the session.
- Assignment statuses: ASSIGNED, IN_PROGRESS, SUBMITTED, REVOKED; expiry is derived. Allowance is one per candidate/test/mode assignment. Expiry prevents starting; active authorized attempts may continue. Revocation ends access.
- `claimLease`/`requireLease` use a 20-second lease and tab identity. Current code preserves same-tab reload/back-forward identity and temporary network recovery. New/duplicated document identities cannot reopen active attempts; abandoned candidates need reassignment.
- Older `OPERATIONS.md` prose says all refreshes are non-resumable. Current `safety-client.ts` and lifecycle `suspend` intentionally preserve same-tab reload ownership. Do not overwrite either protection/recovery based on old prose alone.
- Fresh assessments block previously seen/uncertain module material; repeat practice must be explicit. Exposure is recorded per activated module. Do not mark uncertain history fresh or treat one single-module attempt as exposure to every module.
- Active reassignment/revocation uses interruption confirmation and preserves submitted history. Candidate assignment-number edits are limited to unused/unstarted assignments.
- `TestSafety` enforces fullscreen, current lifecycle navigation, history/mouse guards and many keyboard restrictions. Reading explicitly allows Ctrl+C/Ctrl+V; preserve that exception.
- Browser fullscreen is not OS kiosk enforcement. Do not claim all OS/browser shortcuts or other software can be blocked.
- Preserve `http.body` same-origin validation (`APP_ORIGIN` or incoming host/protocol), JSON content type and 250,000-byte limit; candidate-payload identity rejection; session/lease checks; parameterised SQL.

## 8. Highlighting and toolbar

Authenticated Reading/Listening layouts install `TestHighlighter`. Writing inherits `/test` layout but editor/input elements are excluded; result pages are skipped. Do not install a second highlighter per passage.

- Text/context fingerprints anchor exact-text ranges. Storage is per candidate/attempt/test/section, local to sessionStorage.
- Preserve selection and existing-mark Highlight/Unhighlight, range merge/subtraction, double-click and DOM/scroll/resize handling.
- Native CSS Highlights are preferred; fallback is a clipped pointer-transparent overlay. Highlight colour is `#ffeb80`; popup styles live in `globals.css`. Do not inject wrapping markup that changes React text/offsets.
- Controls, links, headers, footers, nav, SVG, separators, contenteditable, inert and `[data-no-highlight]` content are excluded.
- Highlights and notes are unmarked, local and not database-backed. Notes are not part of backups.
- Toolbar aria-labels Notes, Connection status, Notifications and Menu are event contracts. Connection checks the test server, not public internet availability. Preserve labels, status messages and focus handling.

## 9. Database, keys and result integrity

`db.ts` uses `node:sqlite` `DatabaseSync`, WAL, foreign keys, 5-second busy timeout and `BEGIN IMMEDIATE` transactions. Default is `private/results.sqlite`, overridden by `RESULTS_DB_PATH`. Inspected schema version: 6.

| Table | Actual role |
| --- | --- |
| `users` | Candidate/admin identity and password hashes |
| `sessions` | Hashed token, user FK, expiry |
| `test_assignments` | Candidate FK, test/mode/purpose, status/expiry/allowance; unique candidate/test/mode |
| `attempts` | Student/test/mode/purpose, assignment FK, timestamps, JSON draft/submission `data`, release flag |
| `attempt_progress` | Attempt PK/FK, stage/deadline, audio, lease, instruction/completion flags |
| `answer_keys` | Private JSON config keyed by test and skill |
| `module_exposures` | Attempt/module exposure, candidate/test, certainty/source |
| `results_migrations` | Migration markers including historical exposure backfill |
| `notification_outbox` | Submission events and read/delivery timestamp |
| `audit` | Administrative/result/audio diagnostic events |
| `login_limits` | Login throttling |

`db()` may migrate/seed. Use direct `DatabaseSync(path,{readOnly:true})` for audits, not startup helpers. Do not reset real storage for checks. Inspection found 20 Listening and 20 Reading key rows; this is not certification of all answer values or remote deployment.

Key structure from `types.ts` (structural example, NOT an approved key):

```json
{
  "approved": false,
  "questions": { "1": { "accepted": ["approved answer", "approved alternative"], "maxWords": 2 } },
  "groups": [],
  "bands": [{ "minimum": 0, "band": 0 }]
}
```

Approval requires all 40 rules and the approved paper-specific band conversion. Keys are private runtime records, never public/component data. `private/test-1-approved-keys.json` optionally seeds only Test 1 with INSERT OR IGNORE; Git deployment does not transfer database keys.

Scoring rules:

- `score` requires approval and all 40 accepted-answer lists; missing keys produce pending marks, not invented grades.
- Normalisation: NFKC, case, trim, repeated whitespace, curly apostrophes, slash spacing; special comma-separated A-G labels are sorted. It does not generally remove numeric commas/punctuation or infer synonyms.
- Word count is whitespace-token based; hyphenated words are one token and a spaced slash is a token. Alternatives must fit `maxWords`.
- Unordered `groups` use maximum matching and reject duplicate selections. Groups cannot overlap. Do not use them to conceal numbering mistakes.
- Raw is /40; configurable bands are mock-test estimates, not a universal official IELTS conversion. Preserve existing tables.
- `validateConfig` checks shape, questions, limits, alternatives, groups and monotonic band tables.
- IMPORTANT: `store.saveConfig` audits revisions and RESCORES approved-key changes into UNRELEASED submitted results for that test/skill. Released results stay unchanged. Do not use it when candidate history must remain untouched without explaining and resolving this side effect first. A key-only approved fix may require a narrowly scoped backed-up update that preserves historical submissions. Never silently rescore.
- Submitted JSON includes answers, statuses, raw/bands, key revision hash and Writing texts/counts. Do not expose private keys during tests.
- Writing is manually marked using four 0-9 half-step criteria per task. `writingBands` averages criteria, weights Task 2 twice and rounds to half bands; reuse the function exactly.
- Speaking remains `null`: no Speaking implementation, AI Writing marking or official four-skill overall IELTS band exists.

## 10. APIs and admin behaviour

Reuse `actor`, `body`, `endpoint`, `reply`, `testId`, `candidatePayload` and existing store/lifecycle helpers.

| Endpoint | Methods/purpose |
| --- | --- |
| `/api/auth/login`, `/api/auth/logout` | POST; role-specific auth and candidate-switch safeguards |
| `/api/attempts/start` | POST; assigned test/mode attempt and tab ownership |
| `/api/attempts/[id]/lifecycle` | GET/POST; status, claim/release/suspend, audio, confirm/acknowledge, activate/advance |
| `/api/attempts/[id]/clock` | POST; server deadline, without resetting on retry |
| `/api/attempts/[id]/section` | POST; Listening/Reading answer revision |
| `/api/attempts/[id]/draft` | GET/PATCH; owned drafts/Writing saves |
| `/api/attempts/[id]/audio-diagnostics` | POST; bounded diagnostics, not playback authority |
| `/api/submissions` | POST; final submission with matching attempt/test/deadline |
| `/api/admin/keys` | GET/PUT; private keys, with rescore side effect above |
| `/api/admin/assignments` | GET/POST/PATCH; exposure lookup, assign/reassign/revoke |
| `/api/admin/students` | POST; create candidate |
| `/api/admin/students/[id]` | PATCH; validated profile/unused-assignment edits |
| `/api/admin/students/[id]/password`, `/api/admin/password` | POST; protected password operations |
| `/api/admin/results/[id]` | GET/PATCH; admin view, Writing mark/release |
| `/api/admin/results/export` | GET; private filtered CSV |
| `/api/admin/notifications` | GET/POST; in-app events and mark read |
| `/api/admin/backups`, `/api/admin/backups/[name]` | GET/POST and GET; list/create/authenticated download |

`app/admin/(secure)/layout.tsx` requires admin auth. Preserve results, students, assignments, keys, notifications, backups, password and readiness screens. Results filter in SQL and paginate 25/page; CSV protects formula-like cells. Notifications are in-app, not email/SMS delivery.

Candidates see only their own submissions; scores/feedback require release. Writing remains Awaiting Marking until instructor marking. Preserve module-specific completion, Dhaka display timezone, thank-you and role-safe logout.

## 11. Operational protections and actual limits

- `testReadiness` checks approved complete keys and non-empty audio, NOT correctness or matching media. `requireReady` exists; inspect its call sites before asserting universal enforcement.
- `instrumentation.ts` starts maintenance in Node runtime outside production build. Backups run at startup/every six hours, retaining 28. Portal backup creation validates SQLite integrity and uses private storage.
- Database backups exclude source, audio/images/videos, environment files and local notes/highlights. Keep independent media backups.
- Never expose databases, keys, secrets, CSVs or backups under `public/`. Preserve `.gitignore` exclusions for private storage, `.env*`, build outputs and key exports.
- Restore requires a stopped server and `--confirm-restore`, rejects remaining WAL/SHM, validates integrity/tables, retains the old DB and clears sessions. Never delete WAL/SHM to bypass the check or run restores/resets without authorization.
- `CLASSROOM_HTTP=true` is only for trusted classroom HTTP. Preserve secure public cookies and exact origin/host checks.
- Railway requires a persistent volume and DB path inside it; classroom HTTP there is rejected. Do not change replicas, volumes, domain settings or deploy during content work. Current SQLite assumes coherent single-database operation.
- `next.config.ts` allows exact current LAN IPv4 origins for development, not wildcard origins. Do not weaken security to solve visual problems.
- Local source/HTTP checks do not certify Railway, LAN reliability, concurrency capacity, full audio or real end-to-end candidate operation.

## 12. Mandatory future workflow

### Before changes

1. Read this whole file and relevant installed Next.js docs; check current user scope and narrower instructions.
2. Inspect actual target renderer, reusable components, data/key formats, media, APIs and ownership.
3. Record git status and preserve existing changes. Identify only files necessary for the request.
4. Confirm the current mechanism and independently derive answers for audits; never use a key as proof of itself.
5. Plan the smallest change and obtain approval for out-of-scope or potentially breaking work.

### While changing

1. Reuse established shells/helpers/styles; prefer content/media/approved-key data additions where supported.
2. Preserve settings and question-type interactions; scope unavoidable presentation changes to the named test/group.
3. Keep 1-40 answer slots unique, correct passage/part ranges and `question-N` anchors. Preserve examples, labels, limits, option order and diagrams.
4. Make saved values agree with approved keys. New labelled choices should store letters/codes; completions store original strings; genuine unordered choices need groups. Do not migrate unrelated legacy formats.
5. Isolate test content, keys, media, assignments and attempts. Never bundle a candidate database/credentials into content.
6. Avoid broad formatting, unrelated fixes/refactors and dependency/deployment changes.

### After changes: verification for newly added tests

Run relevant available checks in the authorized scope. Mutating integration checks must use isolated temporary storage and explicitly disposable accounts, never real candidate history. Follow higher-priority session restrictions on tests.

- Load the correct test/mode; compare design against its existing template at relevant viewport sizes/zoom levels.
- Verify all 40 questions individually: sequence, instructions, options, limits, tables/maps/diagrams, passage/part ranges and Writing tasks/media. Count slots, not duplicated printed numbers.
- Exercise actual answer values, radio names, checkbox limits, unordered permutations and restored-draft conversion where applicable.
- Check question/passage/part/task navigation, scrolling, divider, arrows/footer spacing and highlighting/unhighlighting where supported.
- Verify unchanged server clock/audio completion, no early progression, deadline locks, automatic submission and retry. Do not shorten real clocks/recordings for a demo.
- Verify local/server drafts, revisions, same-tab recovery, candidate switches, leases and access. Do not claim arbitrary abandoned-attempt resume.
- Verify final submission, stored answers/marks, Writing awaiting marking, release and logout.
- Check representative unchanged tests in affected shared renderers and unauthenticated/wrong-candidate access. Ensure no cross-test content/key/completion/lock changes.
- Relevant static command: `node node_modules/typescript/bin/tsc --noEmit --incremental false`. Use scoped lint where appropriate. `package.json` has no `test` script: do not claim a nonexistent suite passed. Run available relevant tests when authorized.
- Production build is `npm run build`; it writes `.next/` and can fetch fonts. Check impact before building against a live dev/exam output tree. Do not start/restart production or deploy without authorization.
- For documentation-only work, inspect paths/document/diff; mutating candidate flows, builds and exam trials are unnecessary.
- Review changed/untracked files and final diff. Preserve unrelated work.
- Report changes, reasoning, actual checks/results and unverified limits. Login redirects are not authenticated UI verification; an intended-answer 40/40 score does not prove wording or alternatives.

## 13. Inspection record and maintenance

This rulebook is based on source reads of the architecture map, shared clients/lifecycle/safety/access/auth/assignments/exposure/database/scoring/store, imported Reading/Listening schema inventories, representative legacy components, Writing prompts/editor/result, shared question components/styles, admin key/marking/assignment/result/backup APIs and read-only SQLite table/version/key-count inspection. No candidate credentials, identities, answer values or results are reproduced here.

It is not a fresh line-by-line audit of every historical question or a physical browser/classroom/remote-deployment certification. `README.md`, `OPERATIONS.md`, `RESULTS-SYSTEM.md`, `ASSIGNMENT-SECURITY.md` and `SUBMISSION-SESSION-FIXES.md` provide background but can contain older counts/policies; confirm implementation before relying on them. `CLAUDE.md` points to this file.

Update this document when explicitly approved mechanisms change. Keep structural examples labelled as examples, and do not turn known legacy exceptions into unrequested migrations.

---

## Next.js generated instructions (preserved)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
