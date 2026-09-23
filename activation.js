const HINATA = process.env.HINATA_API_BASE || 'https://am.hinatasoft.com';
const MAILTM = process.env.MAILTM_BASE || 'https://api.mail.tm';

async function jsonFetch(url, options = {}) {
  const r = await fetch(url, options);
  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok || data.success === false) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

function randomString(n = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function getDomain() {
  const data = await jsonFetch(`${MAILTM}/domains?page=1`);
  const domains = Array.isArray(data) ? data : (data['hydra:member'] || data.member || data.domains || []);
  const active = domains.find(d => d.isActive !== false && d.domain);
  if (!active) throw new Error('Mail.tm tidak menyediakan domain saat ini.');
  return active.domain;
}

async function createMailbox() {
  const domain = await getDomain();
  const address = `${randomString(12)}@${domain}`;
  const password = `A${randomString(20)}!9`;
  await jsonFetch(`${MAILTM}/accounts`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ address, password })
  });
  const tokenData = await jsonFetch(`${MAILTM}/token`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ address, password })
  });
  if (!tokenData.token) throw new Error('Token Mail.tm tidak diterima.');
  return { address, token: tokenData.token };
}

async function hinata(path, body) {
  return jsonFetch(`${HINATA}${path}`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify(body)
  });
}

function extractLink(text) {
  const matches = String(text).match(/https?:\/\/[^\s<>"']+/gi) || [];
  const candidates = matches.map(x => x.replace(/&amp;/g, '&').replace(/[),.;]+$/g, ''));
  return candidates.find(x => /magic|verify|activate|login|auth|oob|link/i.test(x)) || candidates[0] || null;
}

async function waitForMagicLink(token, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const data = await jsonFetch(`${MAILTM}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const messages = data['hydra:member'] || data.member || data.messages || [];
    for (const msg of messages) {
      const full = await jsonFetch(`${MAILTM}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const text = [full.subject, full.text, full.html].filter(Boolean).join('\n');
      const link = extractLink(text);
      if (link) return link;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Magic link tidak masuk dalam 45 detik.');
}

export async function createTempActivation(index) {
  const mailbox = await createMailbox();
  try {
    await hinata('/api/send-link', { email: mailbox.address });
    const magicLink = await waitForMagicLink(mailbox.token);
    const result = await hinata('/api/verify-link', { email: mailbox.address, magicLink });
    return {
      index,
      email: mailbox.address,
      uid: result.uid || null,
      orderId: result.orderId || null,
      status: result.membershipStatus || result.status || null,
      validUntil: result.validUntil || null,
      success: true
    };
  } catch (err) {
    return { index, email: mailbox.address, success: false, message: err.message || 'Proses gagal.' };
  }
}

export async function sendOwn(email) {
  return hinata('/api/send-link', { email });
}

export async function verifyOwn(email, magicLink) {
  const result = await hinata('/api/verify-link', { email, magicLink });
  return {
    success: true,
    email,
    uid: result.uid || null,
    orderId: result.orderId || null,
    status: result.membershipStatus || result.status || null,
    validUntil: result.validUntil || null
  };
}
