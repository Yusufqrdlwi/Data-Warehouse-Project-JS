# Cheat Sheet: Virtual Environment Python
## Membuat virtual environment bernama "env"
python3 -m venv env 

## Mengaktifkannya
source env/bin/activate

## Mematikan venv
deactivate



# Cheat Sheet: PostgreSQL + Docker — Project SNJ

Referensi cepat perintah yang dipakai sehari-hari untuk project data warehouse ini.
Semua perintah `docker compose` dijalankan dari folder `dwh_project` (tempat `docker-compose.yml` berada).

---

## 1. Mengelola Container (Docker Compose)

| Perintah | Fungsi |
|---|---|
| `docker compose up -d` | Menghidupkan semua service (PostgreSQL, pgAdmin). `-d` = jalan di background |
| `docker compose stop` | Mematikan container, **data tetap tersimpan** |
| `docker compose start` | Menghidupkan lagi container yang sudah di-stop |
| `docker compose restart` | Mematikan lalu menghidupkan ulang (kalau ada perubahan config kecil) |
| `docker compose down` | Menghapus container & network, **data tetap tersimpan** di volume |
| `docker compose down -v` | Menghapus container & **volume/data sekaligus** — hati-hati, data hilang permanen |
| `docker ps` | Lihat container mana saja yang sedang jalan, beserta status & port |
| `docker ps -a` | Lihat SEMUA container termasuk yang sudah berhenti |
| `docker logs snj-dwh-postgres` | Lihat log/pesan error dari container PostgreSQL |
| `docker logs -f snj-dwh-postgres` | Lihat log secara live/real-time (`-f` = follow) |

---

## 2. Masuk & Keluar dari Database

| Perintah | Fungsi |
|---|---|
| `docker exec -it snj-dwh-postgres psql -U snj_admin -d snj_data_warehouse` | Masuk ke dalam database lewat `psql` |
| `\q` | Keluar dari `psql`, kembali ke terminal biasa |
| `\c nama_database` | Pindah/connect ke database lain (di dalam `psql`) |
| `\du` | Lihat daftar user/role yang ada |

---

## 3. Menjalankan File SQL (Load Schema, dll)

| Perintah | Fungsi |
|---|---|
| `docker exec -i snj-dwh-postgres psql -U snj_admin -d snj_data_warehouse < schema.sql` | Jalankan seluruh isi file `.sql` ke database (dari terminal biasa, di luar `psql`) |
| `docker exec -it snj-dwh-postgres pg_dump -U snj_admin snj_data_warehouse > backup.sql` | Backup seluruh database ke file `.sql` |

---

## 4. Melihat Struktur Database (dalam `psql`)

| Perintah | Fungsi |
|---|---|
| `\l` | Lihat daftar semua database |
| `\dt` | Lihat daftar tabel di database aktif |
| `\dt nama_schema.*` | Lihat tabel di schema tertentu, misal `\dt staging.*` atau `\dt warehouse.*` |
| `\d nama_tabel` | Lihat struktur/kolom dari satu tabel (nama kolom, tipe data, index) |
| `\dn` | Lihat daftar schema (misal: `staging`, `warehouse`) |
| `\dv` | Lihat daftar view |
| `\dx` | Lihat extension yang terpasang |

---

## 5. Query Dasar (SQL Standar, Sama di Manapun)

```sql
-- Matikan pager dulu biar tidak perlu tekan 'q' terus
\pset pager off

-- Lihat semua tabel yang ada di schema warehouse
\dt warehouse.*

-- Lihat semua isi datanya
SELECT * FROM warehouse.fact_produk_latihan;

-- Hitung berapa total baris yang ada
SELECT COUNT(*) FROM warehouse.fact_produk_latihan;

-- Lihat cuma beberapa kolom tertentu, lebih ringkas dibanding SELECT *
SELECT natural_key, title, harga, kategori FROM warehouse.fact_produk_latihan;

-- Keluar setelah selesai
\q

-- Hapus semua data tapi tabel tuetap ada
TRUNCATE TABLE warehouse.fact_produk_latihan;
```

---

## 6. Cek Performa Query (Optimasi)

```sql
-- Lihat rencana eksekusi query (cek apakah pakai index atau full scan)
EXPLAIN ANALYZE SELECT * FROM warehouse.fact_vendor_transaksi WHERE tanggal = '2026-08-01';

-- Update statistik tabel supaya query planner akurat
ANALYZE warehouse.fact_vendor_transaksi;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW warehouse.mv_summary_bulanan;
```

---

## 7. Alur Kerja Harian yang Umum Dipakai

```bash
# Pagi hari / mulai kerja
docker compose up -d
docker ps                    # pastikan status "Up"

# Masuk untuk cek/query data
docker exec -it snj-dwh-postgres psql -U snj_admin -d snj_data_warehouse

# ...kerja di dalam psql...
\q                            # keluar setelah selesai

# Selesai kerja / mau tutup laptop
docker compose stop           # data aman tersimpan, container berhenti
```

---

## Catatan Penting

- **`docker compose down -v`** menghapus data PERMANEN — jangan dipakai sembarangan setelah ada data penting tersimpan. Gunakan `docker compose stop` untuk mematikan sementara.
- Sebelum keluar dari `psql`, pastikan sudah selesai mengetik query (tidak sedang di tengah statement yang belum ada `;`-nya).
- Nama container (`snj-dwh-postgres`) dipakai untuk perintah `docker exec`/`docker logs`. Nama service (`postgres`) dipakai kalau container lain (misal pgAdmin/Airflow) perlu connect ke database ini.
- Jika suatu saat Anda sudah selesai mengerjakan proyek ini dan ingin membebaskan memori laptop, Anda tinggal mematikan kontainer Docker-nya dengan perintah:
# Menghapus semua kontainer dan jaringan yang dibuat oleh file yaml
docker compose down -v

# API Endpoint Project Ini
## Cara Menjalankan API
python3 manage.py runserver 0.0.0.0:8000

http://172.16.3.160:8000/api/transactions_seeder/