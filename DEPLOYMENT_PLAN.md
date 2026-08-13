# Kế hoạch Deploy Ứng dụng MaxRects

Tài liệu này trình bày các bước chi tiết để triển khai (deploy) dự án MaxRects, với mô hình:
- **Frontend**: Host trên **Vercel** (Next.js).
- **Backend**: Host trên **Render** (Node.js/Express).
- **Database**: Sử dụng cơ sở dữ liệu có sẵn trên **Supabase** (PostgreSQL).

## 1. Chuẩn bị Chung
- Đảm bảo mã nguồn (cả thư mục `frontend` và `backend`) đã được push lên GitHub repository (`https://github.com/gioigioi124/maxRects`).
- Đảm bảo bạn có tài khoản trên [Vercel](https://vercel.com/) và [Render](https://render.com/), liên kết với tài khoản GitHub của bạn.

---

## 2. Thông tin Database (Supabase)
Vì dự án sử dụng Supabase và Prisma, bạn cần lấy các thông tin kết nối từ [Supabase](https://supabase.com/):
1. Đăng nhập vào Supabase, chọn project của bạn.
2. Đi tới phần **Project Settings > Database**.
3. Copy **Connection string** (URI). Bạn cần 2 chuỗi:
   - `DATABASE_URL` (thường dùng port 6543 cho Connection Pooler hoặc port 5432).
   - `DIRECT_URL` (dùng để Prisma chạy lệnh push/migrate trực tiếp, port 5432).
4. Đi tới phần **Project Settings > API**.
   - Copy **Project URL** (`SUPABASE_URL`).
   - Copy **anon / public key** (`SUPABASE_ANON_KEY`).

---

## 3. Deploy Backend lên Render
Dự án đã có sẵn file `render.yaml` trong thư mục `backend`, tuy nhiên nếu bạn cài đặt thủ công qua giao diện Web của Render, hãy cấu hình như sau:

1. Đăng nhập vào Render, nhấn **New +** và chọn **Web Service**.
2. Chọn kết nối với repository `gioigioi124/maxRects` của bạn.
3. Trong màn hình cấu hình Web Service:
   - **Name:** `maxrects-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run prisma:generate && npm run prisma:push && npm run build`
     *(Lệnh này sẽ cài đặt dependencies, khởi tạo Prisma Client, đồng bộ database schema và build TypeScript sang JavaScript)*
   - **Start Command:** `npm start` (tương đương lệnh `node dist/index.js` trong package.json)
4. Cấu hình **Environment Variables** (Mở phần Advanced):
   - `DATABASE_URL`: `[Connection String Pooler lấy ở Bước 2]`
   - `DIRECT_URL`: `[Connection String Trực tiếp lấy ở Bước 2]`
   - `SUPABASE_URL`: `[Project URL lấy ở Bước 2]`
   - `SUPABASE_ANON_KEY`: `[Anon Key lấy ở Bước 2]`
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
5. Nhấn **Create Web Service**. Chờ quá trình build hoàn tất. Copy domain URL (ví dụ: `https://maxrects-backend.onrender.com`).

---

## 4. Deploy Frontend lên Vercel
1. Đăng nhập vào Vercel, chọn **Add New... > Project**.
2. Import repository `gioigioi124/maxRects` từ GitHub.
3. Trong phần cấu hình Project:
   - **Project Name:** `maxrects-frontend`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit và chọn thư mục `frontend`.
4. Cấu hình **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Dán URL của Backend vừa lấy ở Bước 3 (ví dụ: `https://maxrects-backend.onrender.com`).
   - `NEXT_PUBLIC_SUPABASE_URL`: `[Project URL lấy ở Bước 2]`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `[Anon Key lấy ở Bước 2]`
5. Nhấn **Deploy**. Vercel sẽ tự động chạy lệnh `npm run build` của Next.js (sử dụng Tailwind và shadcn/ui đã có sẵn).
6. Sau khi thành công, Vercel cung cấp cho frontend của bạn một domain (ví dụ: `https://maxrects-frontend.vercel.app`).

---

## 5. Những lưu ý sau khi Deploy
- **Cấu hình CORS ở Backend:** Kiểm tra xem `backend/src/index.ts` đã cho phép (allow origin) domain của Vercel (`https://maxrects-frontend.vercel.app`) truy cập gọi API chưa. Nếu chưa, bạn cần thêm domain Vercel vào cấu hình CORS, commit và push code lên Github.
- **Kiểm tra chức năng:** Truy cập link của Vercel, test tạo mới thông tin và kiểm tra xem frontend có kết nối thành công tới database Supabase qua API của backend Render hay chưa.
