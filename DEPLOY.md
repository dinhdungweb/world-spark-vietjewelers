# Hướng dẫn Deploy lên Vercel

Dự án World Spark hiện tại đang chạy rất tốt ở local. Để deploy lên Vercel, bạn cần lưu ý vấn đề Database.

## ⚠️ Vấn đề quan trọng: SQLite
Hiện tại dự án đang dùng **SQLite** (`dev.db`).
Vercel là môi trường **Serverless**, hệ thống file sẽ bị reset sau mỗi lần chạy. Do đó, nếu dùng SQLite trên Vercel:
1. Bạn sẽ mất dữ liệu liên tục.
2. Có thể gặp lỗi `Read-only file system`.

**Giải pháp:** Bạn cần dùng **PostgreSQL** (Khuyên dùng Vercel Marketplace: Vercel Postgres, Neon, hoặc Supabase).

---

## Bước 1: Chuẩn bị Database (PostgreSQL)

1. Tạo Project trên Vercel.
2. Vào tab **Storage**, chọn **Postgres** (hoặc tạo trên Neon.tech / Supabase).
3. Lấy chuỗi kết nối `POSTGRES_PRISMA_URL` hoặc `DATABASE_URL`.
   - Ví dụ: `postgres://user:pass@host:5432/dbname?pgbouncer=true&connect_timeout=15`

## Bước 2: Cập nhật Code (Để chuyển sang Postgres)

1. Mở `prisma/schema.prisma`.
2. Đổi `provider = "sqlite"` thành `provider = "postgresql"`.
3. Xóa folder `prisma/migrations`.
4. Chạy lệnh: `npx prisma migrate dev --name init_postgres`.

## Bước 3: Đẩy code lên Git

Đảm bảo bạn đã commit và push code mới nhất chứa schema postgres.

```bash
git add .
git commit -m "chore: switch to postgres for vercel deployment"
git push
```

## Bước 4: Cấu hình Environment Variables trên Vercel

Vào **Settings > Environment Variables** trên Vercel Dashboard, thêm các biến:

1. `DATABASE_URL`: (Chuỗi kết nối Postgres của bạn)
2. `NEXTAUTH_SECRET`: (Tạo một chuỗi ngẫu nhiên, ví dụ chạy lệnh `openssl rand -base64 32`)
3. `NEXTAUTH_URL`: (Domain của Vercel, vd: `https://world-spark.vercel.app`)
4. `ADMIN_EMAIL`: `admin@example.com`
5. `ADMIN_PASSWORD`: (Mật khẩu admin của bạn)

## Bước 5: Deploy

Vercel sẽ tự động deploy khi bạn push code lên Git.
Sau khi deploy xong, nhớ chạy Seed data để có dữ liệu mẫu:
(Bạn có thể chạy script seed từ local kết nối tới DB production, hoặc thiết lập Build Command).

**Cách chạy seed từ local vào DB production:**
1. Cập nhật `.env` ở local thành `DATABASE_URL` của production.
2. Chạy `npx prisma db push`.
3. Chạy `npx tsx prisma/seed-sparks.ts`.
