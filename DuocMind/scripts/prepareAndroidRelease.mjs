import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const placeholders = /^(?:your-project|your-key|placeholder|example|replace-with-publishable-key|replace-me)$/i;

function validUrl(value) {
  const match = /^https:\/\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.supabase\.co\/?$/.exec(value ?? '');
  return Boolean(match && match[1].length <= 63 && !placeholders.test(match[1]));
}

function decodeJson(segment) {
  const bytes = Buffer.from(segment, 'base64url');
  if (bytes.toString('base64url') !== segment) throw new Error();
  return JSON.parse(bytes.toString('utf8'));
}

function validKey(value) {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith('sb_publishable_')) {
    const suffix = value.slice('sb_publishable_'.length);
    return /^[A-Za-z0-9_-]+$/.test(suffix) && !placeholders.test(suffix);
  }
  // Se comprueba formato y rol, no autenticidad ni disponibilidad remota.
  const segments = value.split('.');
  if (segments.length !== 3 || !segments.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const header = decodeJson(segments[0]);
    const payload = decodeJson(segments[1]);
    const signature = Buffer.from(segments[2], 'base64url');
    return header?.alg === 'HS256' && header?.typ === 'JWT' && payload?.role === 'anon'
      && signature.length === 32 && signature.toString('base64url') === segments[2];
  } catch {
    return false;
  }
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const version = process.env.ANDROID_VERSION_CODE;
let failure;
if (!validUrl(url)) {
  failure = 'Se requiere una URL HTTPS válida de proyecto Supabase cloud.';
} else if (!validKey(key)) {
  failure = 'Se requiere una clave publicable o anon válida; nunca una clave de servidor.';
} else if (!/^[1-9][0-9]*$/.test(version ?? '') || Number(version) > 2_100_000_000) {
  failure = 'ANDROID_VERSION_CODE debe ser un entero entre 1 y 2100000000.';
}

if (failure) {
  console.error(failure);
  process.exit(1);
}

try {
  const appPath = resolve(import.meta.dirname, '../app.json');
  const config = JSON.parse(readFileSync(appPath, 'utf8'));
  if (!config.expo?.android || config.expo.android.package !== 'com.duocmind.app') throw new Error();
  config.expo.android.versionCode = Number(version);
  writeFileSync(appPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log('Configuración publicable validada y versionCode Android preparado.');
} catch {
  console.error('No se pudo preparar app.json para el APK Android.');
  process.exit(1);
}
