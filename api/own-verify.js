import { verifyOwn } from '../lib/activation.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method tidak diizinkan.' });
  const email = String(req.body?.email || '').trim();
  const magicLink = String(req.body?.magicLink || '').trim();
  if (!email || !magicLink) return res.status(400).json({ success: false, message: 'Email dan magic link wajib diisi.' });
  try { return res.status(200).json(await verifyOwn(email, magicLink)); }
  catch (err) { return res.status(502).json({ success: false, message: err.message || 'Verifikasi gagal.' }); }
}
