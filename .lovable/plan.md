
# ZEAN TENAN — Roadmap Build

Stack: **TanStack Start + Lovable Cloud (Postgres + Auth + Storage + Server Functions)**. Semua copywriting Bahasa Indonesia. Design system **Swiss Style**: Playfair Display (heading) + Poppins (body), Burgundy `#7B1E3A`, Rose Gold `#CFA27A`, putih dominan, grid 12-kolom, banyak white space, tanpa gradient/glass/neumorphism.

Anda memilih "semuanya" — saya akan tetap mengirim semuanya, tapi dalam **6 fase rilis** agar setiap fase langsung bisa dipakai & ditest. Setelah Anda approve plan ini, saya mulai **Fase 0 + Fase 1** di satu kali build, lalu lanjut fase berikut di pesan-pesan berikutnya.

---

## Fase 0 — Fondasi (langsung dieksekusi)

**Aktivasi & design system**
- Enable Lovable Cloud (Postgres, Auth, Storage)
- Design tokens di `src/styles.css`: warna brand (oklch), radius, shadow halus, spacing
- Font Playfair Display + Poppins via `@fontsource`
- Komponen dasar Swiss: `Container`, `SectionHeader`, `Button`, `Input`, `Select`, `Card`, `Badge`, `Table`, `EmptyState`, `Toast`, `Dialog`, `Sheet`, `Pagination`, `Breadcrumb`
- Layout: `PublicLayout` (navbar + footer), `AccountLayout` (sidebar customer), `AdminLayout` (sidebar admin)
- SEO defaults per route (title, description, OG, canonical, robots, sitemap)

**Skema database awal (RLS + grants lengkap)**
- `profiles` (1-1 `auth.users`) + trigger auto-create
- `user_roles` + enum `app_role` (`customer`, `staff`, `admin`) + fungsi `has_role()`
- `addresses` (alamat buku per user)
- `categories`, `products`, `product_variants` (size/color/stock), `product_images`
- `carts`, `cart_items`
- `orders`, `order_items`, `order_status_history`, `payment_proofs`
- `wishlists`, `reviews`, `vouchers`, `voucher_redemptions`
- `banners`, `blog_posts`
- `audit_logs`, `notifications`
- Storage bucket `product-media` (public), `payment-proofs` (private), `avatars` (public)

---

## Fase 1 — Customer Core (rilis bareng Fase 0)

- **Auth**: Register (email + OTP), Login, Forgot/Reset password, Google sign-in (broker Lovable), Remember me, Logout
- **Halaman publik**: Home placeholder Swiss, Katalog, Detail Produk (galeri, varian, stok, deskripsi, spec, related), Kategori, Search dengan autocomplete + recent search, Filter & sort
- **Cart**: tambah/ubah/hapus, qty stepper, voucher field, catatan, estimasi ongkir manual, subtotal
- **Checkout manual transfer**: form penerima (provinsi/kota/kecamatan/kelurahan/kodepos — dropdown wilayah ID dari tabel), kurir + service (data statis dulu), agreement, generate order number `ZTN-YYYYMMDD-000001`
- **Halaman pembayaran**: instruksi transfer, rekening bank, deadline, upload bukti, status real-time
- **Order tracking**: timeline status (Menunggu Pembayaran → Verifikasi → Diproses → Dikemas → Dikirim → Selesai)
- **Akun**: Dashboard, Profil, Alamat, Riwayat Pesanan, Ubah Password, Hapus Akun

---

## Fase 2 — Customer Plus

- Wishlist (CRUD, move to cart)
- Review produk (rating, foto)
- Voucher redemption di cart
- Notifikasi (in-app + email via Resend)
- Invoice PDF (download + print)
- Size guide interaktif

---

## Fase 3 — Admin Panel

- Layout sidebar admin dengan RBAC (`admin`, `staff`)
- Dashboard: penjualan harian/bulanan, revenue, orders, top products, low stock, chart (Recharts)
- Produk: CRUD + varian + multi image upload + SEO field + draft/publish
- Inventory: stok real-time, mutasi, adjustment, low-stock alert, history
- Order: list, verifikasi bukti bayar (approve/reject), input resi, update status, print label & invoice, refund/cancel
- Customer: list, riwayat, blacklist, catatan
- Review moderation
- Voucher & Banner CRUD
- Audit log

---

## Fase 4 — Marketing & Konten

- Blog (CRUD + SEO)
- Flash sale & promo terjadwal
- Email campaign + abandoned cart recovery (queue via cron job di server route `/api/public/cron/*`)
- Membership & loyalty point
- Referral

---

## Fase 5 — Integrasi Pihak Ketiga

(Anda aktifkan saat sudah punya API key — saya minta via tool secret saat dibutuhkan.)
- **Midtrans** (Snap + webhook signature verify di `/api/public/webhooks/midtrans`)
- **Biteship** (kalkulasi ongkir, tracking, label) — gantikan input manual
- **Fonnte** (WA notification)
- **Resend** (transactional email kustom domain)

---

## Fase 6 — Hardening & Launch

- Rate limit pada server functions sensitif
- Captcha (hCaptcha) di login/register
- Sitemap dinamis + robots
- Lighthouse pass (perf, a11y AA, SEO)
- Reports & export (PDF/Excel/CSV)
- Audit security findings

---

## Detail Teknis (untuk referensi engineer)

**Routing (TanStack Start, file-based)**
```
src/routes/
  __root.tsx
  index.tsx                          # Home
  produk.index.tsx                   # Katalog
  produk.$slug.tsx                   # Detail
  kategori.$slug.tsx
  cari.tsx
  auth.tsx                           # Login/Register/Reset (public)
  _authenticated/
    route.tsx                        # gate (managed)
    keranjang.tsx
    checkout.tsx
    pesanan.index.tsx
    pesanan.$orderNumber.tsx
    pesanan.$orderNumber.bayar.tsx
    wishlist.tsx
    akun.index.tsx
    akun.profil.tsx
    akun.alamat.tsx
    akun.password.tsx
    _admin/
      route.tsx                      # gate role admin/staff via has_role()
      dasbor.tsx
      produk.* / inventory.* / pesanan.* / pelanggan.* / voucher.* / banner.* / blog.* / pengguna.*
  api/public/
    webhooks/midtrans.ts             # Fase 5
    cron/abandoned-cart.ts           # Fase 4
```

**Server logic**
- `createServerFn` + `requireSupabaseAuth` untuk semua aksi user
- `supabaseAdmin` (dynamic import di handler) hanya untuk: verifikasi bayar admin, generate order number atomic via SQL function, kirim notifikasi
- Validasi input dengan Zod di setiap server fn
- Order number atomic: SQL function `generate_order_number()` dengan sequence harian

**Storage**
- `product-media` public — gambar produk
- `payment-proofs` private — bukti transfer, signed URL untuk admin
- `avatars` public — foto profil

**RLS pattern**
- Customer hanya akses row miliknya (`auth.uid() = user_id`)
- Admin/staff lewat `has_role(auth.uid(),'admin')`
- Produk/kategori publik: `TO anon SELECT` dengan filter `published=true`

**State management**
- TanStack Query (sudah ada) + `ensureQueryData` di loader, `useSuspenseQuery` di komponen
- React Hook Form + Zod untuk semua form
- Cart: server-side di tabel `carts` (sync lintas device) + optimistic update

**Tidak dipakai** (dari prompt asli): Next.js, NestJS, Prisma, Redis/BullMQ, Cloudinary — diganti padanan native Lovable Cloud (TanStack Start, Postgres langsung, Postgres queue/cron via pg_cron + server route, Lovable Cloud Storage).

---

## Setelah Anda klik "Implement plan"

Saya kerjakan **Fase 0 + Fase 1** dalam satu batch besar (aktivasi Cloud, migration awal, design system, semua halaman customer core, auth, cart, checkout manual transfer, order tracking). Setelah itu Anda review preview, lalu kita lanjut Fase 2, 3, dst di pesan terpisah.
