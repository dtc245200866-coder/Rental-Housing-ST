# Hệ thống quản lý cho thuê phòng trọ và căn hộ

Ứng dụng web quản lý vòng đời cho thuê phòng trọ: đăng tin, nhận khách, hợp đồng, chốt điện nước,
phát hành hoá đơn, thu tiền, công nợ, báo hỏng và báo cáo — dành cho chủ nhà, quản lý toà nhà,
khách thuê và quản trị hệ thống.

- **Backend:** Spring Boot (Java 17) REST API, JWT access + refresh token, phân quyền theo vai trò trong DB, PostgreSQL 15.
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS, responsive từ 360px, giao diện tiếng Việt.

## Cấu trúc dự án

```
rental-housing-network/
├── backend/           Spring Boot REST API
│   └── src/main/java/com/rentalhousing/backend/
│       ├── entity/    (26 entity: User, Building, Room, Contract, Invoice, Payment, ...)
│       ├── repository/
│       ├── service/   (Auth, Contract, Invoice, Jwt, Permission, Notification, ...)
│       ├── controller/
│       └── config/    (SecurityConfig, DemoDataInitializer, PermissionDataInitializer, ...)
├── frontend/          React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── api/  components/  pages/  auth/  utils/  types.ts
├── docker-compose.yml
└── 1. Hệ thống cho thuê phòng trọ.xlsx   (tài liệu yêu cầu)
```

## Chạy nhanh bằng Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432 (db `rental_housing`, user `postgres`)

Các biến môi trường cần thiết xem trong `.env.example` (sao chép thành `.env` nếu cần).

## Chạy thủ công (phát triển)

### 1. Cơ sở dữ liệu PostgreSQL

Tạo database `rental_housing` (user `postgres`). Sau đó đặt biến môi trường:

```bash
export DB_PASSWORD=postgres           # mật khẩu postgres
export MAIL_USERNAME=your@gmail.com   # Gmail App Password (có thể để trống khi chỉ demo)
export MAIL_PASSWORD=your-app-password
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

Khi chạy lần đầu với bảng `users` còn trống, `DemoDataInitializer` tự nạp dữ liệu mẫu:
2 toà nhà, 30 phòng, 5 dịch vụ, 4 tài khoản và 1 tin đăng.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173. Vite proxy `/api` và `/uploads` tới backend ở `http://localhost:8080`.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị hệ thống | `admin@rental.house` | `Password1` |
| Chủ nhà | `landlord@rental.house` | `Password1` |
| Quản lý toà nhà | `manager@rental.house` | `Password1` |
| Khách thuê | `tenant@rental.house` | `Password1` |

## Phân quyền (4 vai trò)

| Quyền | Admin | Chủ nhà | Quản lý | Khách thuê |
|---|---|---|---|---|
| ADMIN_ACCESS | ✔ | | | |
| BUILDING/ROOM/SERVICE/LISTING/CONTRACT/METER/INVOICE/MAINTENANCE | ✔ | ✔ | ✔ | |
| PAYMENT_MANAGE | ✔ | ✔ | | |
| REPORT_VIEW | ✔ | ✔ | ✔ | |
| PROFILE_VIEW | ✔ | ✔ | | ✔ |

Khách thuê truy cập dữ liệu của chính mình qua `/api/my/**`.

## API chính

- `POST /api/auth/register|login|refresh|logout|forgot-password|reset-password|verify-email`
- `GET /api/auth/me` — thông tin người dùng + danh sách quyền
- `GET /api/public/listings` — tìm tin đăng công khai (lọc quận, giá, diện tích, sắp xếp)
- `GET /api/public/listings/{id}` — chi tiết tin
- `GET/POST/PUT /api/buildings`, `/api/rooms` (+ `/bulk`, `/{id}/status`, `/{id}/images`)
- `GET/POST/PUT /api/services` (+ `/{id}/price`, `/{id}/price-history`)
- `GET/POST /api/listings`, `PUT /api/listings/{id}/status`
- `GET/POST /api/my/requests`, `GET/PUT /api/requests`, `PUT /api/requests/{id}/status`
- `GET/POST /api/contracts`, `PUT /api/contracts/{id}/renew`, `POST /api/contracts/{id}/checkout`
- `GET/POST /api/meter-readings`, `GET /api/meter-readings/list|progress`
- `GET /api/invoices`, `POST /api/invoices/generate`, `PUT /api/invoices/{id}/issue|cancel`
- `GET /api/debts` — công nợ
- `POST /api/my/payments`, `GET /api/payments`, `PUT /api/payments/{id}/confirm|cancel`
- `GET/POST /api/my/maintenance`, `GET/PUT /api/maintenance`, `PUT /api/maintenance/{id}/status`
- `GET /api/reports/summary` — doanh thu & tỉ lệ lấp đầy
- `GET /api/admin/users`, `PUT /api/admin/users/{id}/lock|unlock`
- `GET /api/audit-logs` — nhật ký hoạt động (chỉ Admin)

## Luồng nghiệp vụ chính (end-to-end)

1. Chủ nhà đăng tin từ phòng **Trống** (`/listings`).
2. Khách tìm tin (`/`), gửi yêu cầu thuê/xem phòng (`/listings/{id}`).
3. Chủ nhà duyệt yêu cầu (`/requests`) — phòng chuyển **Đã đặt cọc**.
4. Chủ nhà lập hợp đồng (`/contracts`) — phòng chuyển **Đang thuê**, tin đăng ẩn.
5. Quản lý ghi chỉ số điện nước (`/meter-readings`).
6. Chủ nhà phát hành hoá đơn hàng loạt (`/invoices`), kiểm tra và phát hành từng hoá đơn.
7. Khách báo đã thanh toán (`/my/invoices`), chủ nhà xác nhận (`/payments`), theo dõi công nợ (`/debts`).
8. Trả phòng & tất toán cọc (`/contracts/{id}`) — phòng về **Trống**, tin nháp được nhân bản.

## Ghi chú kỹ thuật

- Tiền tệ dùng kiểu `long` (VND), hiển thị có dấu chấm ngăn cách nghìn.
- Ảnh phòng lưu local trong thư mục `uploads/` (phục vụ qua `/uploads/**`); MinIO nằm ngoài phạm vi demo.
- `ddl-auto=update` — Hibernate tự tạo/ cập nhật bảng; môi trường thật nên chuyển sang migration (Flyway/Liquibase).
