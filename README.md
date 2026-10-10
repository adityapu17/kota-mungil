# Kota Mungil 3D 🏡

Game web 3D ala The Sims: kota kecil, NPC otomatis, waktu/cuaca dinamis, uang, masuk gedung, aksi beranimasi, akun + save game.

## Kontrol
- Tap/klik: jalan, masuk bangunan, ngobrol dengan warga, sapa hewan
- **W A S D** / panah: jalan (Shift = lari) · **E** / Enter / Spasi: interaksi · **M**: peta penuh · **F**: layar penuh · **Esc**: menu
- Geser layar / drag: putar kamera · Klik minimap: buka peta penuh, tap nama bangunan untuk menuju ke sana

## Struktur
- `index.html` — seluruh game (Three.js r128 dari cdnjs)
- `functions/api/[[path]].js` — API akun & save (Cloudflare Pages Function + D1)
- `schema.sql` — skema database D1 (opsional, tabel juga dibuat otomatis)

## Deploy ke Cloudflare Pages
1. Push repo ke GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → pilih repo. Build command kosong, output directory `/`.
3. Cloudflare → Storage & Databases → D1 → Create database (nama bebas, mis. `kota-mungil-db`).
4. Project Pages → Settings → Bindings → Add → D1 database → Variable name **`DB`** → pilih database tadi.
5. Deploy ulang (Deployments → Retry deployment / push commit baru).

Tanpa binding `DB`, game otomatis jalan di **mode lokal** (akun & save disimpan di browser).

## API
- `POST /api/register` `{username,password}` → 200 `{token}` | 409 `username_taken`
- `POST /api/login` → 200 `{token}` | 401
- `POST /api/save` `{token,data}` · `POST /api/load` `{token}`

Password di-hash PBKDF2-SHA256 (100k iterasi + salt) di server; tidak pernah disimpan polos.
