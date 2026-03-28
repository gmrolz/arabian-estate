# Deploy to VPS (72.62.92.16)

**Ready:** `deploy-vps.zip` contains the full site (data + images). No Supabase needed.

---

## Option 1: Hostinger File Manager (easiest)

1. Log in to **hPanel** → **VPS** → your server
2. Open **File Manager** or connect via **SSH** (see Option 2)
3. Go to `/var/www/html` (or your web root)
4. Upload and extract `deploy-vps.zip` so that:
   - `index.html` is in the root
   - `assets/` folder is in the root
   - `vps-data/` folder is in the root (contains images + listings.json)

---

## Option 2: SSH / SCP

1. Get your **root password** from hPanel → VPS → Access Details
2. From your computer:
   ```bash
   # Extract the zip first, then:
   scp -r dist/* root@72.62.92.16:/var/www/html/
   ```
   (Enter root password when prompted)

---

## Option 3: Docker (VPS has Docker)

1. Copy the `arabian-estate` folder to the VPS
2. SSH in: `ssh root@72.62.92.16`
3. Run:
   ```bash
   cd arabian-estate
   # Add .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   docker compose build
   docker compose up -d
   ```

---

## Result

Site will be at **http://72.62.92.16** with all 28 listings and 132 images — no Supabase egress.
