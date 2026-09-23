import { createTempActivation } from '../lib/activation.js';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method tidak diizinkan.' });
  const count = Number(req.body?.count);
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    return res.status(400).json({ success: false, message: 'Jumlah harus 1-5.' });
  }
  try {
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) => createTempActivation(i + 1))
    );
    return res.status(200).json({ success: true, total: results.length, results });
  } catch (err) {
    return res.status(502).json({ success: false, message: err.message || 'Proses gagal.' });
  }
}
