/* eslint-disable @typescript-eslint/no-require-imports -- Standalone isolated regression runner. */
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), Module = require('node:module'), vm = require('node:vm');
const root = process.cwd(), localRequire = Module.createRequire(path.join(root, 'package.json')), ts = localRequire('typescript');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ielts-listening-latency-'));
process.env.RESULTS_DB_PATH = path.join(temporary, 'results.sqlite');
process.env.STUDENT_DB_PATH = path.join(temporary, 'students.sqlite');
process.env.BACKUP_DIR = path.join(temporary, 'backups');
process.env.NODE_ENV = 'production';
delete process.env.RAILWAY_ENVIRONMENT_NAME; delete process.env.APP_ORIGIN; delete process.env.ADMIN_USERNAME; delete process.env.ADMIN_PASSWORD;
const cache = new Map(), cookies = new Map(), jar = { get: n => cookies.has(n) ? { value: cookies.get(n) } : undefined, set: (n, v) => cookies.set(n, v), delete: n => cookies.delete(n) };
function load(file) {
  file = path.resolve(root, file); if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file); cache.set(file, mod); mod.filename = file; mod.paths = Module._nodeModulePaths(path.dirname(file));
  const requireHere = Module.createRequire(file);
  mod.require = name => {
    if (name === 'server-only') return {};
    if (name === 'next/headers') return { cookies: async () => jar };
    if (name === 'next/navigation') return { redirect: destination => { throw Error('REDIRECT ' + destination); } };
    if (name.startsWith('.') || name.startsWith('@/')) {
      const resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      if (fs.existsSync(resolved + '.ts')) return load(resolved + '.ts');
    }
    return requireHere(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
  return mod.exports;
}
const originalNow = Date.now; let now = Date.UTC(2026, 0, 1), database, passed = 0;
function check(name, fn) { return Promise.resolve().then(fn).then(() => { passed++; console.log('PASS ' + name); }); }
(async () => {
  Date.now = () => now;
  const { db, transaction } = load('lib/results/db.ts'); database = db();
  const life = load('lib/results/lifecycle.ts'), store = load('lib/results/store.ts'), auth = load('lib/results/auth.ts'), policy = load('lib/results/listening-progress.ts');
  const route = load('app/api/attempts/[id]/lifecycle/route.ts');
  const user = { id: 'listening-fixture', name: 'Disposable fixture', registrationId: 'listening-fixture', contact: '', role: 'student' };
  database.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(user.id, user.registrationId, user.name, '', user.role, 'disabled');
  database.prepare("INSERT INTO test_assignments(id,candidate_id,test_id,assigned_at,status,mode,purpose) VALUES('listening-assignment',?,2,?,'ASSIGNED','full','repeat')").run(user.id, new Date().toISOString());
  const attempt = store.start(user, 2, 'fixture-tab', 'full'), row = () => database.prepare('SELECT * FROM attempts WHERE id=?').get(attempt.id);
  life.claimLease(row(), 'fixture-tab'); await auth.setSession(user);
  async function call(action, extra = {}, renew = true) {
    if (renew) transaction(() => life.claimLease(row(), 'fixture-tab'));
    const request = new Request('https://fixture.invalid/api/attempts/' + attempt.id + '/lifecycle', { method: 'POST', headers: { origin: 'https://fixture.invalid', 'Content-Type': 'application/json', 'X-IELTS-Candidate': user.id }, body: JSON.stringify({ testId: 2, tabId: 'fixture-tab', action, ...extra }) });
    const response = await route.POST(request, { params: Promise.resolve({ id: attempt.id }) });
    return { status: response.status, data: await response.json() };
  }
  await check('Existing confirmation/start gates and duplicate Start', async () => {
    assert.equal((await call('activate', { skill: 'listening' })).status, 409);
    assert.equal((await call('confirm-instructions', { skill: 'listening' })).status, 200);
    assert.equal((await call('activate', { skill: 'listening' })).data.stage, 'LISTENING_ACTIVE');
    const before = JSON.parse(row().data).listeningTimeline;
    now += 1000; await call('activate', { skill: 'listening' });
    assert.deepEqual(JSON.parse(row().data).listeningTimeline, before);
  });
  const anchor = JSON.parse(row().data).listeningTimeline.anchorAt, duration = life.progress(row()).audio_duration;
  await check('A: position 750 delayed three seconds, then position 753.25', async () => {
    now = anchor + 753000; assert.equal((await call('audio', { position: 750, playbackRate: 1 })).status, 200);
    now = anchor + 753250; const result = await call('audio', { position: 753.25, playbackRate: 1 });
    assert.equal(result.status, 200); assert.equal(result.data.audioPosition, 753.25);
  });
  await check('B: old report cannot alter progress, observation time or anchor', async () => {
    now = anchor + 757000; await call('audio', { position: 757 });
    const before = life.progress(row()), timeline = JSON.parse(row().data).listeningTimeline;
    now += 100; assert.equal((await call('audio', { position: 751, timestamp: 1e30 })).status, 200);
    const after = life.progress(row()); assert.equal(after.audio_position, before.audio_position); assert.equal(after.audio_observed_at, before.audio_observed_at);
    assert.deepEqual(JSON.parse(row().data).listeningTimeline, timeline);
  });
  await check('C: duplicate is idempotent and does not move the baseline', async () => {
    const before = life.progress(row()); now += 100;
    assert.equal((await call('audio', { position: 757 })).status, 200);
    assert.equal(life.progress(row()).audio_observed_at, before.audio_observed_at);
  });
  await check('D: genuine forward seek remains rejected with structured code', async () => {
    const result = await call('audio', { position: 900 }); assert.equal(result.status, 409); assert.equal(result.data.code, 'AUDIO_PROGRESS_AHEAD');
    assert.equal(life.progress(row()).audio_position, 757);
  });
  await check('E: backward packet is harmless; browser rejects unauthorized backward/forward seeks', async () => {
    assert.equal((await call('audio', { position: 100 })).status, 200); assert.equal(life.progress(row()).audio_position, 757);
    assert.equal(policy.unauthorizedAudioSeek(100, 757), true); assert.equal(policy.unauthorizedAudioSeek(900, 757), true);
    assert.equal(policy.unauthorizedAudioSeek(757, 757), false);
  });
  await check('F: declared and disguised accelerated playback remain rejected', async () => {
    let result = await call('audio', { position: 757, playbackRate: 2 }); assert.equal(result.status, 409); assert.equal(result.data.code, 'AUDIO_RATE_INVALID');
    now = anchor + 767000; result = await call('audio', { position: 777, playbackRate: 1 }); assert.equal(result.status, 409);
  });
  await check('G: interrupted reporting with continuous playback does not reset progress', async () => {
    now = anchor + 900000; const result = await call('audio', { position: 900, playbackRate: 1 }); assert.equal(result.status, 200); assert.equal(result.data.stage, 'LISTENING_ACTIVE');
    assert.equal(JSON.parse(row().data).listeningTimeline.anchorAt, anchor);
  });
  await check('Client timestamps cannot extend elapsed time or forge completion', async () => {
    let result = await call('audio', { position: duration, ended: true, timestamp: 1e30, elapsed: duration, duration: 1, listeningTimeline: { version: 1, anchorAt: -1e30, anchorPosition: duration }, playbackRate: 1 }); assert.equal(result.status, 409);
    now = anchor + (duration - 1.5) * 1000; result = await call('audio', { position: duration, ended: true, answers: {}, revision: 10 });
    assert.equal(result.status, 409); assert.equal(result.data.code, 'AUDIO_COMPLETION_INCOMPLETE');
    assert.equal(life.progress(row()).stage, 'LISTENING_ACTIVE');
  });
  await check('Lease security remains authoritative', async () => {
    now += 21000; const result = await call('audio', { position: 901 }, false); assert.equal(result.status, 409);
  });
  await check('H: legitimate end, final answers and duplicate end are preserved', async () => {
    now = anchor + duration * 1000 + 1000;
    const result = await call('audio', { position: duration, ended: true, answers: { 1: 'fixture answer' }, revision: 20, playbackRate: 1 });
    assert.equal(result.status, 200); assert.equal(result.data.stage, 'LISTENING_COMPLETED');
    assert.equal(JSON.parse(row().data).listening.questions.find(q => q.number === 1).answer, 'fixture answer');
    const snapshot = row().data;
    assert.equal((await call('audio', { position: duration, ended: true, answers: { 1: 'must not replace' }, revision: 21 })).status, 200);
    assert.equal(row().data, snapshot);
  });
  await check('Existing Listening-to-Reading gates and original duration remain intact', async () => {
    assert.equal(life.progress(row()).audio_duration, duration);
    const result = await call('advance', { skill: 'listening', answers: { 1: 'fixture answer' }, revision: 22 });
    assert.equal(result.status, 200); assert.equal(result.data.pendingSection, 'reading');
    assert.equal((await call('activate', { skill: 'reading' })).status, 409);
    await call('acknowledge-completion'); await call('confirm-instructions', { skill: 'reading' });
    const started = await call('activate', { skill: 'reading' }); assert.equal(started.data.deadline, now + 3600000);
  });
  await check('Stale audio acknowledgements cannot regress progress or section state', () => {
    const current = { id: 'fixture', testId: 2, stage: 'LISTENING_ACTIVE', audioPosition: 750, serverNow: 10000 };
    assert.equal(policy.acceptAudioAcknowledgement(current, { ...current, audioPosition: 740, serverNow: 9000 }), false);
    assert.equal(policy.acceptAudioAcknowledgement({ ...current, stage: 'READING_ACTIVE' }, current), false);
    assert.equal(policy.acceptAudioAcknowledgement({ ...current, stage: 'LISTENING_COMPLETED' }, current), false);
    assert.equal(policy.acceptAudioAcknowledgement(current, { ...current, audioPosition: 753, serverNow: 11000 }), true);
  });
  await check('Older attempt compatibility and existing single-module completion', async () => {
    database.prepare("INSERT INTO test_assignments(id,candidate_id,test_id,assigned_at,status,mode,purpose) VALUES('legacy-assignment',?,3,?,'ASSIGNED','listening','repeat')").run(user.id, new Date().toISOString());
    const legacy = store.start(user, 3, 'fixture-tab', 'listening'), legacyRow = () => database.prepare('SELECT * FROM attempts WHERE id=?').get(legacy.id);
    transaction(() => { life.claimLease(legacyRow(), 'fixture-tab'); life.confirmInstructions(legacyRow(), 'listening'); life.activateListening(legacyRow()); });
    const start = now, old = JSON.parse(legacyRow().data); delete old.listeningTimeline;
    database.prepare('UPDATE attempts SET data=? WHERE id=?').run(JSON.stringify(old), legacy.id);
    database.prepare('UPDATE attempt_progress SET audio_position=?,audio_observed_at=? WHERE attempt_id=?').run(732, start + 732000, legacy.id);
    now = start + 753000; transaction(() => life.observeAudio(legacyRow(), 750, false));
    const timeline = JSON.parse(legacyRow().data).listeningTimeline;
    now = start + 753250; transaction(() => life.observeAudio(legacyRow(), 753.25, false));
    assert.equal(life.progress(legacyRow()).audio_position, 753.25);
    assert.deepEqual(JSON.parse(legacyRow().data).listeningTimeline, timeline);
    const length = life.progress(legacyRow()).audio_duration; now = start + length * 1000 + 1000;
    transaction(() => life.claimLease(legacyRow(), 'fixture-tab'));
    const request = new Request('https://fixture.invalid/api/attempts/' + legacy.id + '/lifecycle', { method: 'POST', headers: { origin: 'https://fixture.invalid', 'Content-Type': 'application/json', 'X-IELTS-Candidate': user.id }, body: JSON.stringify({ testId: 3, tabId: 'fixture-tab', action: 'audio', position: length, ended: true, playbackRate: 1, answers: { 1: 'single module fixture' }, revision: 1 }) });
    const response = await route.POST(request, { params: Promise.resolve({ id: legacy.id }) });
    assert.equal(response.status, 200); assert.equal((await response.json()).stage, 'COMPLETED');
    assert.ok(legacyRow().submitted_at);
  });
  await check('Actual client seek, rate and stale-acknowledgement handlers', async () => {
    const refs = [], effects = [], sent = [], published = []; let pauses = 0, plays = 0, current = { id: 'client-fixture', testId: 2, stage: 'LISTENING_ACTIVE', audioPosition: 0, serverNow: now, path: '/listening?test=2', section: 'listening' };
    const jsx = (type, props) => ({ type, props });
    const fakeWindow = { setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {} };
    const stub = name => name === 'react' ? { useRef: value => { const ref = { current: value }; refs.push(ref); return ref; }, useState: value => [value, () => {}], useEffect: cb => effects.push(cb) } : name === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : name === 'next/navigation' ? { useRouter: () => ({ replace() {} }), useSearchParams: () => ({ get: () => '2' }) } : name === '@/lib/results/listening-progress' ? policy : name === '@/lib/results/client' ? { attemptKey: () => 'attempt', draftKey: () => 'draft', useAnswerDraft: () => true, draftRevision: () => 1, RequestError: class extends Error {}, request: async (url, payload) => { sent.push({ url, payload }); return { ...current, audioPosition: 1, serverNow: now - 100 }; } } : name === '@/lib/results/safety-client' ? { statusSnapshot: () => current, publishStatus: value => published.push(value), tabId: () => 'tab', useAttemptStatus: () => current } : { default: () => null };
    const mod = { exports: {} };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'app/listening/TestClient.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: mod, exports: mod.exports, require: stub, window: fakeWindow, sessionStorage: { getItem: () => 'client-fixture', setItem() {} }, console, Date, process, Math });
    const tree = mod.exports.default();
    function find(node) { if (!node || typeof node !== 'object') return null; if (node.type === 'audio') return node; for (const child of [node.props?.children].flat(Infinity)) { const found = find(child); if (found) return found; } return null; }
    const audioNode = find(tree); assert.ok(audioNode);
    const audio = { currentTime: 0, duration: 1500, readyState: 4, seeking: false, paused: false, ended: false, playbackRate: 1, play: async () => { plays++; }, pause() { pauses++; }, addEventListener() {}, removeEventListener() {} };
    refs[0].current = audio; effects[2](); audioNode.props.onSeeking({ currentTarget: audio });
    audio.currentTime = 10; audioNode.props.onTimeUpdate({ currentTarget: audio }); await new Promise(r => setImmediate(r));
    assert.equal(pauses, 0); assert.equal(plays, 1, 'A stale acknowledgement must not restart the recording');
    audio.currentTime = 2; audioNode.props.onSeeking({ currentTarget: audio }); assert.equal(audio.currentTime, 10);
    audioNode.props.onSeeking({ currentTarget: audio }); audio.currentTime = 100; audioNode.props.onSeeking({ currentTarget: audio }); assert.equal(audio.currentTime, 10);
    audio.playbackRate = 2; audioNode.props.onRateChange({ currentTarget: audio }); assert.equal(audio.playbackRate, 1);
    // Seeking to the initial restore position may not emit a browser event.
    // Its one-use permission must still expire when playback advances.
    current = { ...current, audioPosition: 0 }; effects[2]();
    audio.currentTime = 10; audioNode.props.onTimeUpdate({ currentTarget: audio });
    audio.currentTime = 0; audioNode.props.onSeeking({ currentTarget: audio }); assert.equal(audio.currentTime, 10);
    current = { ...current, audioPosition: 100 }; assert.equal(published.length, 0);
    assert.ok(sent.some(r => r.payload?.action === 'audio' && r.payload.playbackRate === 1));
  });
  await check('SQLite integrity and relationships', () => {
    assert.equal(database.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(database.prepare('PRAGMA foreign_key_check').all().length, 0);
  });
  console.log('PASS: ' + passed + ' Listening regression groups. Disposable database only; no production requests or data changes. Real-browser media validation remains required.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; database?.close(); });
