# ĐẶC TẢ DỰ ÁN: WEBAPP TỐI ƯU CẮT MÚT (FOAM CUTTING OPTIMIZER)

> File này là đặc tả đầy đủ để bắt đầu code ngay, không cần hỏi lại ngữ cảnh nghiệp vụ.

---

## 1. BỐI CẢNH NGHIỆP VỤ

Xưởng sản xuất cắt các miếng mút (foam) từ tấm phôi lớn để đóng gói/lót sản phẩm. Mỗi sản phẩm cần nhiều miếng mút với kích thước khác nhau, cắt từ nhiều loại mút (chất liệu) khác nhau. Bài toán là: cho trước danh sách các miếng cần cắt, tối ưu số lượng tấm phôi phải mua/dùng bằng cách xếp hình (nesting) các miếng lên tấm sao cho tốn ít tấm nhất.

### 1.1 Cấu trúc dữ liệu nghiệp vụ (3 cấp)

```
Đơn hàng sản xuất (Order)
 └─ Chi tiết (Product Part)          -- 1 đơn có nhiều Chi tiết thuộc các Mã hàng khác nhau, kèm Số lượng bộ.
     └─ Piece (dòng kích thước)  -- 1 chi tiết có nhiều dòng: Cạnh 1, Cạnh 2, Cạnh 3, Loại mút, Số lượng
```

**Ví dụ dữ liệu thực tế (từ file Excel mã hàng "Opa II SO"):**

| Mã hàng | Chi tiết | Cạnh 1 | Cạnh 2 | Cạnh 3 | Loại mút | Số lượng |
|---|---|---|---|---|---|---|
| Opa II SO | ST7X5 | 10 | 445 | 620 | HT40 | 1 |
| Opa II SO | ST7X5 | 15 | 445 | 180 | HT40 | 1 |
| Opa II SO | ST7X5 | 15 | 650 | 180 | HT40 | 2 |
| Opa II SO | ST7X5 | 90 | 480 | 700 | HT40 | 1 |
| Opa II SO | ST7X5 | 20 | 480 | 700 | HT26A | 1 |
| Opa II SO | ST7X5 | 30 | 480 | 700 | HT26A | 1 |
| Opa II SO | 3S24SHITO | 40 | 2100 | 30 | EP | 1 |
| Opa II SO | 3S24SHITO | 30 | 695 | 335 | EP | 2 |
| Opa II SO | 3S24SHITO | 20 | 850 | 125 | EP | 1 |
| Opa II SO | 3S24SHITO | 20 | 690 | 690 | HT26A | 3 |

### 1.2 Quy tắc nghiệp vụ cốt lõi

1. **Độ dày tấm phôi** của 1 piece = **cạnh nhỏ nhất** trong 3 cạnh (Cạnh 1, 2, 3).
2. **2 cạnh còn lại** (width, height) = kích thước hình chữ nhật cần cắt trên mặt tấm — **được xoay 90° tự do**.
3. Chỉ những piece **cùng Loại mút + cùng độ dày** mới được cắt chung 1 tấm phôi (không thể trộn khác chất liệu/độ dày).
4. Khổ tấm phôi tiêu chuẩn hiện có: **160×200 cm** và **180×200 cm** (1600×2000mm và 1800×2000mm) — có thể mở rộng thêm khổ khác qua cấu hình, không hardcode.
5. Xưởng cắt bằng **dao/cưa thẳng (guillotine)** — mọi đường cắt phải xuyên suốt chiều dài hoặc chiều rộng phần đang cắt (không cắt tự do kiểu CNC/laser). Thuật toán packing **bắt buộc** phải tôn trọng ràng buộc guillotine.
6. Có thể **gộp piece từ nhiều Mã hàng trong cùng 1 Đơn hàng**, và **gộp piece từ nhiều Đơn hàng khác nhau** (kể cả đơn cũ đang chờ cắt + đơn mới upload sau, vì các đơn được tải lên theo thứ tự thời gian) — miễn cùng nhóm (Loại mút, Độ dày) — để tăng hiệu suất sử dụng tấm.

### 1.3 Các chức năng cần có (danh sách yêu cầu gốc)

1. **Thêm mới / Cập nhật Mã hàng** bằng cách upload file Excel (cấu trúc như bảng ở mục 1.1).
2. **Tạo Đơn hàng sản xuất** bằng cách upload file Excel (Mã hàng, Chi tiết, Số lượng) hoặc chọn bằng tay.
3. **In Đơn hàng** (toàn bộ nội dung đơn ra PDF).
4. **In 1 Chi tiết** (1 trang PDF).
5. **In tất cả các Chi tiết** (mỗi chi tiết 1 trang, xuất PDF nhiều trang).
6. **Gợi ý ghép nhóm cắt**: gợi ý piece/bộ nào nên cắt chung với piece/bộ nào — trong cùng đơn hàng, hoặc với các đơn hàng khác đang chờ cắt (theo thứ tự thời gian upload).
7. **Vẽ layout cắt** (sơ đồ xếp hình từng tấm) + **xuất báo cáo** (số tấm, khổ, hiệu suất, thể tích mút).

---

## 2. THUẬT TOÁN TỐI ƯU (đã nghiên cứu & thống nhất)

### 2.1 Phân loại bài toán

Đây là bài toán **2D Rectangular Guillotine Cutting Stock Problem** (NP-hard) — không có lời giải đúng tuyệt đối trong thời gian hợp lý, dùng **heuristic đa biến thể (multi-heuristic)**.

### 2.2 Pipeline xử lý

```
1. Input: danh sách piece (đã nhân theo số bộ cần sản xuất)
2. Với mỗi piece: tính thickness = min(cạnh1,cạnh2,cạnh3); w,h = 2 cạnh còn lại (sort)
3. Group theo (material, thickness)
4. Với mỗi nhóm:
   a. Thêm kerf (mạch cắt, VD 3-5mm) vào mỗi chiều của piece
   b. Chạy packer với NHIỀU biến thể heuristic (xem 2.3), cho phép xoay 90°,
      thử cả 2 khổ tấm (160x200, 180x200), cho phép TRỘN khổ trong cùng nhóm
   c. Chọn kết quả có: số tấm ít nhất -> nếu bằng nhau thì hiệu suất cao nhất
5. Output: danh sách tấm đã dùng, mỗi tấm có danh sách piece với (x, y, w, h, rotated)
```

### 2.3 Thư viện & thuật toán cụ thể

- **Thư viện**: [`maxrects-packer`](https://github.com/soimy/maxrects-packer) (npm) — dựa trên nghiên cứu *"A Thousand Ways to Pack the Bin"* (Jylänki, 2010): http://clb.demon.fi/files/RectangleBinPack.pdf
- **Chế độ bắt buộc**: guillotine-compatible (thư viện có option `allowRotation: true`, và cấu hình split heuristic).
- Chạy tối thiểu **3-5 biến thể heuristic** khác nhau (khác thứ tự sắp xếp đầu vào: theo diện tích giảm dần, theo cạnh dài giảm dần...) cho mỗi nhóm, lấy kết quả tốt nhất — vì heuristic đơn lẻ không đảm bảo tối ưu.
- **Tương đương phía Python** (nếu sau này cần service Python riêng cho thuật toán nâng cao): `rectpack` — cùng nền tảng thuật toán, có sẵn các biến thể `GuillotineBssfSas`, `GuillotineBafSas`, v.v.

### 2.4 Ví dụ code khung (Node.js, dùng làm điểm khởi đầu cho `packer.service.ts`)

```ts
import { MaxRectsPacker } from "maxrects-packer";

interface Piece {
  id: string;           // part_piece_id (nhân theo qty -> mỗi instance 1 id riêng)
  width: number;         // mm, đã + kerf
  height: number;        // mm, đã + kerf
  sourceOrderItemId: string;
}

interface SheetOption {
  name: string;           // "160x200"
  width: number;          // 1600
  height: number;         // 2000
}

const SHEET_OPTIONS: SheetOption[] = [
  { name: "160x200", width: 1600, height: 2000 },
  { name: "180x200", width: 1800, height: 2000 },
];

function packGroup(pieces: Piece[]) {
  let best: { sheets: number; result: any } | null = null;

  // thử nhiều sheet option (và có thể trộn) + nhiều heuristic sort order
  const sortStrategies = [
    (a: Piece, b: Piece) => b.width * b.height - a.width * a.height, // area desc
    (a: Piece, b: Piece) => Math.max(b.width, b.height) - Math.max(a.width, a.height), // long side desc
  ];

  for (const sheet of SHEET_OPTIONS) {
    for (const sortFn of sortStrategies) {
      const sorted = [...pieces].sort(sortFn);
      const packer = new MaxRectsPacker(sheet.width, sheet.height, 0, {
        smart: true,
        pot: false,
        square: false,
        allowRotation: true,
        border: 0,
      });
      packer.addArray(sorted.map(p => ({ width: p.width, height: p.height, data: p })));

      const sheetsUsed = packer.bins.length;
      if (!best || sheetsUsed < best.sheets) {
        best = { sheets: sheetsUsed, result: { sheetName: sheet.name, bins: packer.bins } };
      }
    }
  }
  return best;
}
```

> Lưu ý: cần viết thêm logic tính utilization (%), và với ràng buộc guillotine chặt chẽ hơn có thể cần triển khai thêm thuật toán split thủ công nếu `maxrects-packer` không đảm bảo 100% guillotine-cuttable — cần kiểm tra kỹ tài liệu thư viện, có thể phải tự implement guillotine split rule (Shorter-Axis-Split / Longer-Axis-Split) nếu thư viện không hỗ trợ sẵn.

### 2.5 Logic gợi ý ghép nhóm (Giai đoạn 5)

- Query toàn bộ `part_pieces` (nhân theo `order_items.set_quantity`) thuộc các đơn hàng **chưa được gán vào `cutting_batch_items`** (tức "đang chờ cắt"), không giới hạn ở 1 đơn hàng.
- Group theo `(material_id, thickness)` trên toàn bộ tập "đang chờ".
- Với mỗi nhóm có piece đến từ ≥ 2 đơn hàng khác nhau: chạy packing 2 lần — (a) cắt riêng từng đơn, (b) cắt gộp — so sánh tổng số tấm/hiệu suất, sinh gợi ý dạng:
  > "Gộp đơn #A012 + #A015 (cùng HT26A dày 20mm): cắt riêng cần 5+4=9 tấm, cắt gộp chỉ cần 7 tấm → tiết kiệm 2 tấm (~22%)."
- Người dùng xác nhận gộp → tạo `cutting_batch` mới liên kết `cutting_batch_items` từ nhiều `order_item_id`.

---

## 3. KIẾN TRÚC HỆ THỐNG & TECH STACK (đã chốt)

```
┌─────────────────────────┐        ┌──────────────────────────┐        ┌─────────────────┐
│   FRONTEND (Vercel)     │ <----> │   BACKEND (Render)        │ <----> │  SUPABASE         │
│   Next.js + React       │  REST  │   Node.js + Express       │  SQL   │  Postgres+Auth+   │
│                          │  API   │                            │        │  Storage          │
└─────────────────────────┘        └──────────────────────────┘        └─────────────────┘
```

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Frontend framework | **Next.js** (App Router) | Người dùng đã quen React/JS |
| Frontend hosting | **Vercel** | Deploy nhanh, tối ưu cho Next.js |
| Backend framework | **Node.js + Express** (TypeScript) | Cùng ngôn ngữ với frontend, đỡ context-switch |
| Backend hosting | **Render** (Web Service, có thể thêm Background Worker sau) | Không giới hạn thời gian chạy khắt khe như Vercel serverless — phù hợp packing nặng |
| Database | **Supabase Postgres** | Managed Postgres + Auth + Storage tích hợp sẵn |
| ORM | **Prisma** | Type-safe, migrate schema dễ, dùng chung được cả 2 phía nếu cần |
| Đọc/ghi Excel | **SheetJS (xlsx)** | Chuẩn công nghiệp, chạy được cả client và server |
| Thuật toán packing | **maxrects-packer** (npm) | Cùng nền tảng thuật toán với `rectpack` (Python), đã research kỹ ở mục 2 |
| Vẽ layout | **react-konva** (Canvas) | Vẽ tương tác, zoom, click từng piece |
| Xuất PDF | **@react-pdf/renderer** hoặc **pdfkit** (backend) | In đơn hàng / chi tiết / layout ra PDF |
| Xử lý job nặng (nếu cần) | **Render Background Worker** hoặc queue đơn giản (BullMQ + Redis) | Đơn hàng lớn, packing nhiều nhóm cùng lúc |

### Links tham khảo đã tổng hợp

- Thuật toán: https://github.com/soimy/maxrects-packer , https://www.npmjs.com/package/maxrects-packer , http://clb.demon.fi/files/RectangleBinPack.pdf
- Excel: https://docs.sheetjs.com/ , https://github.com/exceljs/exceljs
- Vẽ layout: https://konvajs.org/ , https://react-pdf.org/
- Backend/Render: https://render.com/docs/deploy-node-express-app , https://render.com/docs/databases , https://render.com/docs/background-workers
- ORM: https://www.prisma.io/docs
- Nâng cao (v2, nếu cần Python sau này): https://developers.google.com/optimization (Google OR-Tools)

---

## 4. DATABASE SCHEMA (Supabase Postgres / Prisma)

```sql
-- Loại mút (bảng tra cứu)
CREATE TABLE materials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text UNIQUE NOT NULL,      -- HT40, HT26A, EP, K24, K326...
  created_at    timestamptz DEFAULT now()
);

-- Mã hàng
CREATE TABLE products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE NOT NULL,      -- "Opa II SO"
  name          text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Chi tiết (nhóm) thuộc 1 mã hàng
CREATE TABLE product_parts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  part_name     text NOT NULL,             -- "ST7X5", "3S24SHITO"
  created_at    timestamptz DEFAULT now()
);

-- Từng dòng kích thước (piece) thuộc 1 chi tiết
CREATE TABLE part_pieces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_part_id uuid NOT NULL REFERENCES product_parts(id) ON DELETE CASCADE,
  edge1           numeric NOT NULL,
  edge2           numeric NOT NULL,
  edge3           numeric NOT NULL,
  thickness       numeric GENERATED ALWAYS AS (LEAST(edge1, edge2, edge3)) STORED,
  width           numeric NOT NULL,        -- cạnh còn lại nhỏ hơn trong 2 cạnh, đã tính sẵn khi insert
  height          numeric NOT NULL,        -- cạnh còn lại lớn hơn
  material_id     uuid NOT NULL REFERENCES materials(id),
  quantity        int NOT NULL,            -- số lượng / 1 bộ mã hàng
  created_at      timestamptz DEFAULT now()
);

-- Đơn hàng sản xuất
CREATE TABLE orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code    text UNIQUE NOT NULL,
  status        text NOT NULL DEFAULT 'draft', -- draft | pending_cut | cutting | done
  created_at    timestamptz DEFAULT now()
);

-- 1 đơn hàng gồm nhiều mã hàng, mỗi mã hàng cần sản xuất bao nhiêu bộ
CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id),
  set_quantity  int NOT NULL,              -- số bộ cần sản xuất
  created_at    timestamptz DEFAULT now()
);

-- Kết quả gộp nhóm để cắt (1 batch = 1 material + 1 thickness,
-- có thể gồm piece từ nhiều order_item / nhiều đơn hàng khác nhau)
CREATE TABLE cutting_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id   uuid NOT NULL REFERENCES materials(id),
  thickness     numeric NOT NULL,
  status        text NOT NULL DEFAULT 'suggested', -- suggested | confirmed | cut
  created_at    timestamptz DEFAULT now()
);

-- Piece nào (nhân theo số lượng) thuộc batch nào, tấm nào, tọa độ nào sau packing
CREATE TABLE cutting_batch_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_batch_id  uuid NOT NULL REFERENCES cutting_batches(id) ON DELETE CASCADE,
  order_item_id     uuid NOT NULL REFERENCES order_items(id),
  part_piece_id     uuid NOT NULL REFERENCES part_pieces(id),
  sheet_index       int NOT NULL,          -- tấm số mấy trong batch
  sheet_size        text NOT NULL,         -- "160x200" | "180x200"
  x numeric NOT NULL, y numeric NOT NULL,
  w numeric NOT NULL, h numeric NOT NULL,
  rotated           boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- Kết quả layout đã sinh ra (để in lại / xem lại lịch sử)
CREATE TABLE packing_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cutting_batch_id  uuid NOT NULL REFERENCES cutting_batches(id) ON DELETE CASCADE,
  total_sheets      int NOT NULL,
  total_volume_m3   numeric,
  utilization_pct   numeric,
  pdf_url           text,                  -- link file trong Supabase Storage
  created_at        timestamptz DEFAULT now()
);
```

---

## 5. CẤU TRÚC THƯ MỤC

### 5.1 Frontend (`frontend/`, Next.js, deploy Vercel)

```
frontend/
├─ app/
│  ├─ (dashboard)/
│  │  ├─ products/
│  │  │  ├─ page.tsx              # danh sách mã hàng
│  │  │  ├─ [id]/page.tsx         # chi tiết 1 mã hàng
│  │  │  └─ import/page.tsx       # upload Excel thêm/cập nhật mã hàng
│  │  ├─ orders/
│  │  │  ├─ page.tsx              # danh sách đơn hàng
│  │  │  ├─ new/page.tsx          # tạo đơn hàng mới (chọn nhiều mã hàng)
│  │  │  └─ [id]/page.tsx         # chi tiết đơn hàng + nút in
│  │  ├─ packing/
│  │  │  ├─ suggestions/page.tsx  # gợi ý ghép nhóm cắt
│  │  │  └─ [batchId]/page.tsx    # xem layout 1 batch (canvas)
│  │  └─ print/
│  │     └─ [type]/[id]/page.tsx  # trang in (đơn hàng / 1 chi tiết / tất cả chi tiết)
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ excel-upload/ExcelDropzone.tsx
│  ├─ layout-canvas/SheetCanvas.tsx      # vẽ 1 tấm (react-konva)
│  ├─ layout-canvas/LayoutViewer.tsx
│  ├─ print/OrderPrintView.tsx
│  ├─ print/PartPrintView.tsx
│  └─ ui/                                # shared components
├─ lib/
│  ├─ supabase-client.ts
│  ├─ api-client.ts                      # gọi backend Render
│  ├─ excel-parser.ts                    # parse trước khi gửi lên (preview)
│  └─ types.ts
├─ public/
├─ styles/
├─ next.config.js
├─ .env.local.example
└─ package.json
```

### 5.2 Backend (`backend/`, Node/Express, deploy Render)

```
backend/
├─ src/
│  ├─ routes/
│  │  ├─ products.routes.ts
│  │  ├─ orders.routes.ts
│  │  ├─ packing.routes.ts
│  │  └─ print.routes.ts
│  ├─ controllers/
│  │  ├─ products.controller.ts
│  │  ├─ orders.controller.ts
│  │  ├─ packing.controller.ts
│  │  └─ print.controller.ts
│  ├─ services/
│  │  ├─ excel/excel-import.service.ts   # parse + validate + upsert mã hàng
│  │  ├─ packing/grouping.service.ts     # group theo material + thickness
│  │  ├─ packing/packer.service.ts       # wrap maxrects-packer, guillotine (xem mục 2.4)
│  │  ├─ packing/suggestion.service.ts   # gợi ý ghép giữa các đơn/batch (xem mục 2.5)
│  │  └─ print/pdf-report.service.ts     # sinh PDF (đơn hàng / chi tiết / layout)
│  ├─ db/
│  │  ├─ supabase-client.ts
│  │  └─ prisma/schema.prisma            # copy schema từ mục 4
│  ├─ middlewares/error-handler.ts
│  ├─ utils/
│  └─ index.ts                           # entry point Express app
├─ render.yaml
├─ .env.example
└─ package.json
```

---

## 6. API ENDPOINTS (backend)

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/products/import` | Upload Excel, parse, validate, upsert Mã hàng + Chi tiết + Piece |
| GET | `/products` | Danh sách mã hàng |
| GET | `/products/:id` | Chi tiết 1 mã hàng (kèm parts + pieces) |
| POST | `/orders` | Tạo đơn hàng mới |
| POST | `/orders/:id/items` | Thêm mã hàng + số bộ vào đơn |
| GET | `/orders` | Danh sách đơn hàng |
| GET | `/orders/:id` | Chi tiết đơn hàng (tổng hợp toàn bộ piece) |
| GET | `/print/order/:id` | Xuất PDF toàn bộ đơn hàng |
| GET | `/print/part/:partId` | Xuất PDF 1 chi tiết (1 trang) |
| GET | `/print/product/:productId/all-parts` | Xuất PDF tất cả chi tiết (mỗi chi tiết 1 trang) |
| GET | `/packing/suggestions` | Lấy danh sách gợi ý ghép nhóm (mục 2.5) |
| POST | `/packing/run` | Chạy packing cho 1 batch (nhận list order_item_id hoặc order_id) |
| GET | `/packing/batches/:id` | Xem kết quả layout 1 batch (tọa độ từng piece từng tấm) |
| GET | `/packing/batches/:id/report.pdf` | Xuất PDF layout để đưa xưởng cắt |

---

## 7. ROADMAP TRIỂN KHAI (checklist theo giai đoạn)

### Giai đoạn 0 — Khởi tạo hạ tầng
- [x] Tạo Supabase project, chạy SQL ở mục 4 (hoặc `prisma migrate`)
- [x] Repo `frontend` (Next.js) deploy "Hello World" lên Vercel
- [x] Repo `backend` (Express) deploy `/health` endpoint lên Render
- [x] Cấu hình env vars 2 phía (Supabase URL/key, CORS backend cho domain Vercel)

### Giai đoạn 1 — Quản lý Mã hàng (CRUD + Import Excel)
- [x] `POST /products/import`: parse Excel (SheetJS) đúng cấu trúc mục 1.1, validate, upsert
- [x] Logic cập nhật: mã hàng đã tồn tại → xóa `product_parts` cũ + insert lại
- [x] FE `/products/import`: kéo thả Excel, xem trước bảng trước khi lưu
- [x] FE `/products`: danh sách, tìm kiếm, xem chi tiết

### Giai đoạn 2 — Quản lý Đơn hàng
- [x] `POST /orders`, `GET /orders`
- [x] FE `/orders/new`: import bằng Excel (Mã hàng, Chi tiết, Số lượng) hoặc chọn tay
- [x] FE `/orders`, `/orders/[id]`

### Giai đoạn 3 — In ấn
- [ ] 3 endpoint PDF ở mục 6 (order / 1 part / all parts)
- [ ] FE: nút "In" tương ứng từng trang

### Giai đoạn 4 — Thuật toán Packing cốt lõi
- [ ] `grouping.service.ts`: gom piece theo `(material, thickness)`, nhân theo `set_quantity`
- [ ] `packer.service.ts`: implement theo khung code mục 2.4, đảm bảo ràng buộc guillotine
- [ ] Lưu kết quả vào `cutting_batches` + `cutting_batch_items`
- [ ] `POST /packing/run`

### Giai đoạn 5 — Gợi ý ghép giữa các đơn hàng
- [ ] `suggestion.service.ts` theo logic mục 2.5
- [ ] FE `/packing/suggestions`: hiển thị gợi ý, cho chọn gộp/không gộp

### Giai đoạn 6 — Vẽ Layout & Báo cáo
- [ ] FE `SheetCanvas.tsx` (react-konva): vẽ theo x,y,w,h,rotated từ `cutting_batch_items`
- [ ] FE `LayoutViewer.tsx`: chuyển qua các tấm, tổng quan số tấm/khổ/hiệu suất
- [ ] BE `pdf-report.service.ts`: xuất layout thành PDF (mỗi tấm 1 trang)
- [ ] Lưu PDF vào Supabase Storage, ghi `pdf_url` vào `packing_reports`

### Giai đoạn 7 — Hoàn thiện
- [ ] Supabase Auth nếu cần phân quyền nhiều người dùng
- [ ] Test với dữ liệu Excel thực tế nhiều mã hàng/nhiều đơn
- [ ] Tối ưu hiệu năng (Render Background Worker nếu đơn hàng lớn)
- [ ] Tài liệu vận hành cho người dùng cuối (xưởng)

---

## 8. GHI CHÚ KỸ THUẬT QUAN TRỌNG (đừng bỏ sót khi code)

1. **Đơn vị thống nhất**: lưu mọi cạnh trong DB bằng **milimet** (numeric), chỉ đổi ra m²/m³ ở tầng hiển thị/báo cáo — tránh sai số làm tròn.
2. **Kerf (mạch cắt)**: là **tham số cấu hình** (không hardcode), có thể khác nhau giữa loại mút/máy cắt — nên có bảng config hoặc field ở `materials`.
3. **Ràng buộc guillotine là bắt buộc**: kiểm tra kỹ `maxrects-packer` có đảm bảo guillotine-cuttable hay không; nếu không, cần tự bổ sung logic split (Shorter/Longer-Axis-Split) — đây là điểm rủi ro kỹ thuật lớn nhất, nên làm proof-of-concept sớm ở Giai đoạn 4 trước khi code các phần khác.
4. **Xoay 90°**: piece được phép xoay tự do — đảm bảo cấu hình `allowRotation: true` trong packer, và khi vẽ layout (Canvas) phải xử lý đúng `rotated` flag.
5. **Truy vết ngược**: `cutting_batch_items` luôn giữ `order_item_id` + `part_piece_id` — khi xem layout phải biết được piece đó thuộc mã hàng/đơn hàng nào, đặc biệt quan trọng khi gộp nhiều đơn vào 1 batch.
6. **Khổ tấm mở rộng được**: đừng hardcode chỉ 2 khổ 160x200/180x200 — thiết kế bảng/config `sheet_sizes` để sau này thêm khổ mới không cần sửa code.
7. **Trộn khổ tấm trong cùng 1 batch**: thuật toán nên cho phép 1 batch dùng cả 2 khổ nếu tối ưu hơn (không ép chỉ 1 khổ cho cả batch).
