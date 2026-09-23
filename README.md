# Hinata Activation - Vercel

Versi serverless untuk Vercel.

## Deploy
1. Import folder/ZIP ini ke Vercel.
2. Tidak perlu install dependency.
3. Set Environment Variables:
   - HINATA_API_BASE=https://am.hinatasoft.com
   - MAILTM_BASE=https://api.mail.tm
4. Deploy.

## Endpoint
- POST /api/create-temp {"count":1..5}
- POST /api/own-send {"email":"..."}
- POST /api/own-verify {"email":"...","magicLink":"..."}
- GET /api/health

Catatan: proses temp-mail melakukan polling inbox sampai 45 detik. Batas runtime function Vercel diset 60 detik. Jika platform/plan Vercel membatasi durasi lebih rendah, gunakan job/queue async.
