// Cloudflare Pages Function: shared team notes per home (KV binding name: NOTES).
// Sits behind Cloudflare Access, which supplies the signed-in user's email header.
const KEY = 'all';
const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export async function onRequestGet({ env }) {
  if (!env.NOTES) return json({ error: 'KV binding NOTES missing' }, 500);
  return json((await env.NOTES.get(KEY, 'json')) || {});
}
export async function onRequestPut({ env, request }) {
  if (!env.NOTES) return json({ error: 'KV binding NOTES missing' }, 500);
  const who = request.headers.get('Cf-Access-Authenticated-User-Email') || 'unknown';
  let b; try { b = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
  if (!b || typeof b.url !== 'string' || b.url.length > 400) return json({ error: 'bad url' }, 400);
  const text = String(b.text || '').slice(0, 4000);
  const all = (await env.NOTES.get(KEY, 'json')) || {};
  if (text.trim()) all[b.url] = { text, by: who, t: Date.now() }; else delete all[b.url];
  await env.NOTES.put(KEY, JSON.stringify(all));
  return json({ ok: true, by: who });
}
