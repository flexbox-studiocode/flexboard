import { input, password } from '@inquirer/prompts';

const baseUrl = (process.argv[2] || (await input({ message: 'Base URL:', default: 'http://localhost:3000' }))).replace(/\/$/, '');
const email = (await input({ message: 'Email akun:' })).trim();
const secret = await password({ message: 'Password:', mask: '*', toggleMask: false });
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);
const safe = async (response) => {
  const type = response.headers.get('content-type') || 'unknown';
  let payload = null;
  try { payload = await response.json(); } catch {}
  const error = payload?.error;
  const source = error && typeof error === 'object' ? error : payload;
  return { status: response.status, type, code: typeof source?.code === 'string' ? source.code : 'NONE', message: typeof source?.message === 'string' ? source.message : 'none' };
};
try {
  const signIn = await fetch(`${baseUrl}/api/auth/sign-in/email`, { method: 'POST', headers: { 'content-type': 'application/json', origin: baseUrl, referer: `${baseUrl}/login` }, body: JSON.stringify({ email, password: secret }), signal: controller.signal });
  const result = await safe(signIn);
  console.log(`sign-in: status=${result.status} content-type=${result.type} code=${result.code} message=${result.message}`);
  if (!signIn.ok) process.exitCode = 1;
  else {
    const setCookies = typeof signIn.headers.getSetCookie === 'function' ? signIn.headers.getSetCookie() : (signIn.headers.get('set-cookie') || '').split(/,(?=[^;]+=[^;]+)/).filter(Boolean);
    const cookie = setCookies.map((value) => value.split(';', 1)[0]).join('; ');
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: cookie ? { cookie } : {}, signal: controller.signal });
    const meType = me.headers.get('content-type') || 'unknown';
    let meBody = null;
    try { meBody = await me.json(); } catch {}
    const meError = meBody?.error;
    const role = meBody?.data?.user?.role || 'none';
    const meCode = typeof meError?.code === 'string' ? meError.code : 'NONE';
    console.log(`me: status=${me.status} content-type=${meType} role=${role} session-verified=${me.ok && role !== 'none' ? 'yes' : 'no'} code=${meCode}`);
    if (!me.ok || role === 'none') process.exitCode = 1;
  }
} catch (error) {
  process.exitCode = 1;
  console.error(error?.name === 'AbortError' ? 'network: request timed out after 10 seconds' : `network: ${error instanceof Error ? error.message : 'request failed'}`);
} finally { clearTimeout(timeout); }
