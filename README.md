# WebShop — Website bán hàng online

Website bán hàng đầy đủ: đăng ký/đăng nhập, database người dùng (SQLite),
đặt hàng trừ số dư, và **nạp tiền phải được admin duyệt** mới cộng vào tài khoản.

## 1. Chạy thử trên máy của bạn

Yêu cầu: đã cài [Node.js](https://nodejs.org) bản 18+.

```bash
cd webshop
npm install
cp .env.example .env      # rồi mở .env, đổi JWT_SECRET và mật khẩu admin
npm run seed              # tạo tài khoản admin + vài sản phẩm mẫu
npm start                 # server chạy tại http://localhost:3000
```

Mở `http://localhost:3000`. Đăng nhập admin bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD`
đã đặt trong file `.env`.

## 2. Đưa website lên internet (có địa chỉ thật, nhiều người dùng từ nhiều thiết bị)

Vì đây là ứng dụng có **backend + database riêng**, cần một nơi lưu trữ (hosting)
chạy được Node.js liên tục — không thể chỉ "tải file HTML" lên là xong.
Có 2 lựa chọn phổ biến, cả hai đều có bản miễn phí:

### Cách A — Render.com (khuyên dùng, dễ nhất)
1. Đưa toàn bộ thư mục `webshop` này lên một repository GitHub (tạo repo mới, push code lên).
2. Vào https://render.com → **New → Web Service** → chọn repo GitHub vừa tạo.
3. Cấu hình:
   - Build Command: `npm install && npm run seed`
   - Start Command: `npm start`
4. Vào tab **Environment**, thêm các biến: `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   (giống nội dung file `.env` nhưng **đừng** đưa file `.env` thật lên GitHub).
5. Bấm Deploy. Sau vài phút Render sẽ cấp cho bạn một địa chỉ dạng
   `https://ten-app-cua-ban.onrender.com` — đây là địa chỉ mà mọi người, từ điện thoại
   hay máy tính, đều truy cập được.

> Lưu ý: ở gói miễn phí, dữ liệu SQLite lưu trên đĩa **có thể bị xoá** khi Render khởi
> động lại container. Nếu muốn dữ liệu tồn tại lâu dài, dùng gói có "persistent disk"
> (trả phí thấp) hoặc đổi sang PostgreSQL (Render có PostgreSQL miễn phí riêng — có thể
> nhờ mình chuyển code sang PostgreSQL nếu bạn muốn dùng lâu dài).

### Cách B — VPS riêng (DigitalOcean, Vultr, AWS Lightsail...)
1. Thuê một VPS Ubuntu, cài Node.js.
2. Copy thư mục `webshop` lên VPS (dùng `scp` hoặc `git clone`).
3. Chạy `npm install && npm run seed`.
4. Dùng `pm2` để giữ server chạy nền: `npm install -g pm2 && pm2 start server.js`.
5. Cài Nginx làm reverse proxy + gắn domain riêng của bạn (vd: `shop.tencuaban.com`)
   và bật SSL miễn phí bằng Certbot (Let's Encrypt) để có `https://`.

Cả hai cách đều cho ra **một địa chỉ website duy nhất**, dùng chung database —
bất kỳ ai vào link đó, từ điện thoại, máy tính, ở đâu cũng thấy cùng dữ liệu,
đăng nhập độc lập theo tài khoản của họ.

## 3. Cấu trúc chức năng chính

- `POST /api/auth/register`, `/login` — đăng ký / đăng nhập (JWT)
- `GET /api/products` — danh sách sản phẩm (public)
- `POST/PUT/DELETE /api/products` — quản lý sản phẩm (chỉ admin)
- `POST /api/orders` — đặt hàng, tự trừ số dư và trừ kho
- `POST /api/deposits` — user gửi yêu cầu nạp tiền (trạng thái "pending")
- `GET /api/deposits?status=pending` — admin xem yêu cầu chờ duyệt
- `POST /api/deposits/:id/approve` — admin duyệt → cộng tiền vào tài khoản user
- `POST /api/deposits/:id/reject` — admin từ chối

## 4. Bảo mật cần lưu ý trước khi dùng thật

- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài, không dùng giá trị mẫu.
- Đổi mật khẩu admin mặc định ngay sau khi tạo.
- Nếu nhận tiền thật, **không tự động cộng tiền** khi user tự khai — luôn giữ bước
  admin xác minh thủ công (đã làm đúng ở luồng nạp tiền này) hoặc tích hợp cổng
  thanh toán thật (VNPay, Momo Business, PayOS...) để tự động xác minh giao dịch.
- Nên thêm HTTPS (SSL) trước khi công khai cho người dùng thật nhập mật khẩu.
