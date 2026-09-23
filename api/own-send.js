import { sendOwn } from '../lib/activation.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method tidak diizinkan.' });
  const email = String(req.body?.email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Email tidak valid.' });
  try { await sendOwn(email); return res.status(200).json({ success: true }); }
  catch (err) { return res.status(502).json({ success: false, message: err.message || 'Gagal mengirim magic link.' }); }
}
