# Candidate submission and Admin session fixes — 5 October 2026

## Findings and root causes

- Admin and Candidate previously used one `ielts_session` cookie. Signing in as either role revoked/replaced the other role's session. A candidate cookie presented to an Admin page caused the old role guard to redirect to `/`, explaining the homepage redirect.
- There was no `/admin` landing page. Only named subpages were implemented.
- Login used client router navigation, which could retain earlier cached authenticated page state. Role login now performs a full navigation.
- Final submission never logged the candidate out. Writing also wrote test-only completion flags and legacy test-only draft keys. These leftover flags are removed and final submission uses attempt-specific answers only.
- The existing database already scoped submissions correctly: attempts belong to `student_id`, `test_id` and `assignment_id`; assignment status updates target the specific assignment ID. No global database submission flag or cross-account database status update was found or reproduced. Isolation was verified using three independent candidates. The removed completion flags were not being read by the current Writing renderer, so they are not established as the sole cause of the reported shared status.

## Changes

- Separate HTTP-only cookies: `ielts_admin_session` and `ielts_candidate_session`, with role-specific lookup, login and logout. Existing `ielts_session` cookies are accepted only for their verified database role during rollout.
- Admin guards always send missing/wrong-role Admin authentication to `/admin/login`. A valid Admin session takes priority for Admin requests even when a candidate session also exists.
- `/admin` now requires Admin authentication and redirects to `/admin/results`; authenticated visits to `/admin/login` also go to Results.
- Candidate API requests can send their originating tab's candidate ID as a consistency check. Mismatches are rejected. This header never grants access; session ownership and assignment checks remain authoritative.
- Submission commits answers, result and exact assignment status through the existing transaction, then opens the authenticated Thank You page. After five seconds on that page, the candidate session is revoked. Admin session is retained. A failed submission leaves candidate authentication and drafts intact.
- After the successful response, the browser opens `/test/writing/result?id=...&signout=1`. The page shows the saved submission details before a five-second logout timer runs. After logout succeeds, the browser clears IELTS session storage and opens `/verify?submitted=1`, showing a saved-and-signed-out message. That query flag is informational only and cannot alter test status or authorize access.
- Candidate login uses full navigation to avoid cached pages from another account. Manual logout targets only the selected role.
- Previously saved submissions remain available to their owner after logging in again through the existing submission link.

## Database / setup

No schema migration, password change, test content change or database reset. Existing records and approved keys are preserved. No migration command is needed. Restart the running application after deploying these source changes; existing valid legacy sessions remain supported.

Cookies remain host-only, Path=/, SameSite=Lax and HTTP-only. Production requires HTTPS for Secure cookies. A login in the in-app browser is not a login in Firefox or Chrome; each browser/profile must authenticate separately, using the same hostname as its own login. Candidate credentials are not Admin credentials.

## Verification

- A assigned Tests 1 and 2: failed submission kept session; successful Test 1 submission saved and revoked candidate authentication, marked only A/Test1 submitted, and left A/Test2 assigned.
- B assigned the same Test 1: separate attempt remained available. Browser flow traversed Listening → Reading → Writing → Finish Test. All sections and both multiline Writing tasks saved under B, then the browser returned to Candidate login. Database assertions confirmed correct ownership and candidate session revocation.
- C assigned Test 2: Test 1 absent from dashboard and blocked server-side; Test 2 available.
- Foreign attempt/draft/section/submission IDs and stale candidate-tab identity were rejected. Another candidate's confirmation did not reveal private answers or identity.
- Admin direct `/admin` access and refresh succeeded, including after candidate submission/logout. Unauthenticated and candidate-only Admin access went to Admin login. Admin logout retained candidate authentication.
- HTTP requests with Chrome and Firefox user-agent headers passed. These are server compatibility checks, not engine tests. Only the in-app browser was available for actual browser automation; direct Chrome/Firefox engine verification remains outstanding.
- TypeScript and production build passed. Lint: zero errors, 14 warnings.
- Hashes confirmed 80 protected homepage/content/prompt/public-asset files unchanged. Three disposable QA accounts and related records were removed; real records retained.

## Files changed

- `app/components/LogoutButton.tsx`
- `app/verify/page.tsx`
- `app/verify/VerifyClient.tsx`
- `app/admin/(secure)/layout.tsx`
- `app/admin/login/page.tsx`
- `app/api/submissions/route.ts`
- `app/api/attempts/start/route.ts`
- `app/api/attempts/[id]/clock/route.ts`
- `app/api/attempts/[id]/draft/route.ts`
- `app/api/attempts/[id]/section/route.ts`
- `app/api/auth/logout/route.ts`
- `app/test/writing/WritingTestClient.tsx`
- `lib/results/auth.ts`
- `lib/results/client.ts`
- `lib/results/http.ts`
- `app/admin/(secure)/page.tsx`
- `app/admin/login/AdminLoginClient.tsx`

## Thank You page follow-up
The automatic logout timer is enabled only on the post-submit Thank You URL. Viewing an older submission from the dashboard does not automatically sign out. Logout verifies the expected candidate ID so a stale Thank You tab cannot sign out another candidate who has since logged in. Logout failures retain the confirmation and offer a retry; saved results are not lost. Added app/test/writing/result/SubmissionLogout.tsx; updated the submission route, Writing client, result page and logout route.
