# VPS Deploy

## Option A: Docker (recommended for 72.62.92.16)

**On your VPS (72.62.92.16):**

1. Copy the `arabian-estate` folder to the server (or clone the repo).

2. Create `.env` with Supabase credentials (for migration during build):
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Build and run:
   ```bash
   cd arabian-estate
   docker compose build
   docker compose up -d
   ```

4. Site runs at `http://72.62.92.16` (port 80).

---

## Option B: Manual (build locally, upload dist)

1. Run migration: `npm run migrate-vps`
2. Set `VITE_USE_VPS_DATA=true` in `.env`
3. Build: `npm run build`
4. Upload `dist/` to VPS (e.g. `/var/www/html/`).
