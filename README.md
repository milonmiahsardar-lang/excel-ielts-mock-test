# Excel Institute IELTS Mock Tests

Existing Next.js IELTS test website with candidate assignments, protected timed sections and instructor results.

Use Node 24.x. Run `npm run dev -- --hostname 0.0.0.0` for local development. For classroom exams, build before the session with `npm run build` and run `npm run start -- --hostname 0.0.0.0 --port 3000`.

Read [OPERATIONS.md](OPERATIONS.md) for classroom HTTP settings, Railway persistent storage, readiness, backups, restore, password recovery and the trial checklist. Administrator entry: `/admin/login`.

Do not publish the private results database, answer keys, environment credentials or downloaded backups.
