# Website audit — 5 October 2026

## Fixes completed

- Reading and Listening answers recover from the candidate-owned server draft as well as browser storage. Inputs wait for recovery before accepting changes.
- Both Writing tasks autosave to the server, retry after reconnection, and recover in a fresh tab. Paragraphs are retained.
- Continuing from Reading waits for section saving. Fresh-tab final submission retains earlier Listening and Reading answers.
- Reading and Writing countdown deadlines persist on the server; refresh no longer grants another hour.
- Test 4 Reading Questions 34–36 now store each selected answer in its own question slot.
- Listening retains playback position in browser storage and exposes a Play audio button when autoplay is blocked.
- Candidate dashboard resumes the current stage and links completed submissions. Candidate and admin dashboards have working sign-out controls.
- Candidate login rejects admin credentials in candidate mode; authenticated candidates go directly to their dashboard.
- Admin result search handles repeated query parameters. Results awaiting official keys display an accurate pending status.
- Site metadata now identifies Excel Institute and IELTS Mock Tests.
- Test 2 summary inputs match the requested square blue boxes with question numbers before each box.

## Preservation

Hashes confirmed all 80 protected files are unchanged: the original homepage, JSON test datasets, passage-data files, Writing prompts and public assets. Existing test wording and answer keys were retained. Functional fixes touched shared code and the affected renderers; there was no redesign.

## Verification

- TypeScript checking and production build passed.
- Lint: zero errors; 15 existing warnings remain.
- Checked five protected pages for every Test 1–20 (100 page requests), plus draft save/read recovery for all 20 tests.
- Authorization checks covered assigned/unassigned tests, ownership, tampered IDs, duplicate attempts/submissions, revocation, expiry and assignment reset. Foreign draft reads/writes and clocks were denied; submitted draft writes and clocks were denied.
- Browser checks confirmed Reading answer recovery and divider resizing, Writing recovery of both tasks after refresh and in a fresh tab, Test 4 multi-selection storage, final submission, submitted-dashboard links and logout.
- Ten available audio files returned correct byte-range responses. Referenced images/static assets exist. Actual audible playback and every recording's spoken content were not checked.
- Static checks covered supported imported question types. Apparent missing numbers in Listening 14 and 16 were confirmed in the renderer: flow-chart Questions 21–25 and paired answer fields 7, 19 and 32.
- Generated audit candidate, assignments, attempts and submission were removed; other database records were retained.

## Missing items / remaining limitations

1. Audio files are missing for Listening Tests **10 and 12–20**. Add `public/audio/listening-test-N.mp3` for those numbers. These paths already exist in the test player configuration.
2. Approved Listening/Reading answer keys exist only for **Test 1**. Tests **2–20** cannot receive accurate automatic scores until approved keys are supplied; scores remain pending.
3. Countdown deadlines survive refresh, but a strict server cutoff and automatic final submission at time zero are not implemented.
4. Notes, Notifications and some header menu controls are currently placeholders. Speaking is not implemented.
5. Admin pagination/export and password recovery are not implemented.
6. Autosave retains a local copy and retries online, but simultaneous edits in multiple tabs/devices are not conflict-resolved. Countdown initialization failures have no dedicated visible retry notice yet.
7. This was a local functional/code audit. It does not establish production hosting reliability, an exhaustive security assessment, or word-for-word accuracy of all source documents and recordings.

This report supplements RESULTS-SYSTEM.md and ASSIGNMENT-SECURITY.md with the current draft/timer behavior.
