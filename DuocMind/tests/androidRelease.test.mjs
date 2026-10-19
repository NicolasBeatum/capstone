import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const projectRoot = resolve(import.meta.dirname, '..');
const appSource = readFileSync(join(projectRoot, 'app.json'), 'utf8');
const publicKey = 'sb_publishable_synthetic0123456789';
const url = 'https://synthetic-project.supabase.co';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (role, header = { alg: 'HS256', typ: 'JWT' }) =>
  `${encode(header)}.${encode({ role })}.${Buffer.alloc(32, 1).toString('base64url')}`;

function run(overrides = {}, source = appSource) {
  const fixture = mkdtempSync(join(tmpdir(), 'duocmind-release-'));
  try {
    mkdirSync(join(fixture, 'scripts'));
    copyFileSync(join(projectRoot, 'scripts/prepareAndroidRelease.mjs'), join(fixture, 'scripts/prepareAndroidRelease.mjs'));
    writeFileSync(join(fixture, 'app.json'), source);
    // Un .env válido no debe rescatar inputs de CI ausentes o inválidos.
    writeFileSync(join(fixture, '.env'), `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publicKey}\n`);
    const env = {
      ...process.env,
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
      ANDROID_VERSION_CODE: '42',
      ...overrides,
    };
    const result = spawnSync(process.execPath, [join(fixture, 'scripts/prepareAndroidRelease.mjs')], { env, encoding: 'utf8' });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
      if (env[name]) assert.ok(!output.includes(env[name]), 'No debe revelar configuración recibida');
    }
    return { ...result, contents: readFileSync(join(fixture, 'app.json'), 'utf8') };
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

for (const key of [publicKey, jwt('anon')]) {
  test(`prepara versión conservando configuración con clave ${key === publicKey ? 'publicable' : 'anon'}`, () => {
    const result = run({ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(result.status, 0);
    const expected = JSON.parse(appSource);
    expected.expo.android.versionCode = 42;
    assert.deepEqual(JSON.parse(result.contents), expected);
    assert.ok(!result.contents.includes(key));
  });
}

const invalidInputs = [
  ['URL ausente', { EXPO_PUBLIC_SUPABASE_URL: '' }],
  ['URL marcador', { EXPO_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co' }],
  ...['http://synthetic-project.supabase.co', 'https://localhost', 'https://synthetic-project.supabase.co.evil.example',
    'https://user:password@synthetic-project.supabase.co', 'https://synthetic-project.supabase.co:443',
    'https://synthetic-project.supabase.co/path', 'https://synthetic-project.supabase.co?key=value',
    'https://synthetic-project.supabase.co#fragment', `${url}\n`, 'https://synthetic-project.supabase.co/../']
    .map((value, index) => [`URL inválida ${index}`, { EXPO_PUBLIC_SUPABASE_URL: value }]),
  ...['', 'replace-with-publishable-key', 'sb_publishable_', 'sb_publishable_placeholder', 'sb_secret_synthetic',
    `${publicKey}\n`, `${publicKey}\t`, `${publicKey}\u001b`, `${publicKey}\u007f`, `${publicKey} space`,
    'sb_publishable_...', jwt('service_role'), jwt('authenticated'), jwt('anon', { alg: 'none', typ: 'JWT' }),
    'eyJinvalid.invalid.signature', `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role: 'anon' })}.short`,
    `${jwt('anon')}.extra`]
    .map((value, index) => [`clave inválida ${index}`, { EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: value }]),
  ...['', '0', '-1', '1.5', '1e3', ' 1', '01', '2100000001', '9007199254740993']
    .map((value, index) => [`versión inválida ${index}`, { ANDROID_VERSION_CODE: value }]),
];

for (const [name, input] of invalidInputs) {
  test(`${name}: falla sin modificar app.json ni revelar valores`, () => {
    const result = run(input);
    assert.equal(result.status, 1);
    assert.equal(result.contents, appSource);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.length > 0);
  });
}

for (const version of ['1', '2100000000']) {
  test(`acepta el límite de versión ${version}`, () => {
    const result = run({ ANDROID_VERSION_CODE: version });
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.contents).expo.android.versionCode, Number(version));
  });
}

test('no revela contenido de app.json ante JSON inválido', () => {
  const source = '{"privateValue":"synthetic-private", malformed';
  const result = run({}, source);
  assert.equal(result.status, 1);
  assert.equal(result.contents, source);
  assert.ok(!result.stderr.includes('synthetic-private'));
});

test('el preparador no modifica el app.json del repositorio', () => {
  assert.equal(readFileSync(join(projectRoot, 'app.json'), 'utf8'), appSource);
});
