# 🐎 YEP Horse Racing Game - Hướng Dẫn Vận Hành

Tài liệu này hướng dẫn chi tiết cách thiết lập, vận hành và xử lý sự cố cho trò chơi "Ngựa Chạy" tại tiệc Year End Party.

## 1. Chuẩn Bị Trước Giờ G

### Yêu Cầu Kỹ Thuật

- **Máy chủ (Laptop của dev/kỹ thuật)**: Đã cài Node.js.
- **Mạng Wifi**: Một bộ Wifi Router riêng (hoặc Wifi hội trường ổn định). **Tất cả thiết bị (Server, Laptop MC, Điện thoại khán giả) PHẢI kết nối cùng một mạng Wifi.**
- **Tắt Firewall (Tường lửa)** trên Máy chủ để đảm bảo các máy khác có thể truy cập cổng `3000`.

### Cấu Hình Kết Quả (Quan Trọng)

Trước khi build app, hãy cập nhật danh sách người trúng giải trong file:
👉 `src/common/constants/winners.ts`

```typescript
export const PRE_DETERMINED_WINNERS = {
  consolation: [101, 102, 103, 104, 105], // Lucky Numbers giải KK
  third: [201, 202, 203],
  second: [301, 302],
  first: [999], // Lucky Number giải Nhất
};
```

_Sau khi sửa file này, CẦN chạy lại lệnh khởi động để hệ thống cập nhật._

---

## 2. Khởi Động Hệ Thống

Tại máy chủ, mở Terminal (CMD/PowerShell) tại thư mục dự án và chạy:

```bash
npm run start:clean
```

Lệnh này sẽ tự động:

1.  Tắt các server cũ đang chạy ngầm (nếu có).
2.  Build code mới nhất.
3.  Khởi động Server tại cổng `3000`.

### Kiểm tra IP máy chủ

Gõ lệnh `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux) để lấy địa chỉ IP LAN (IPv4).

> Ví dụ: `192.168.1.146`

---

## 3. Hướng Dẫn Truy Cập

### 📱 Dành Cho Khán Giả (Người Chơi)

Gửi link hoặc tạo QR Code link sau cho khán giả:

> **http://[IP-MÁY-CHỦ]:3000**
> _(Ví dụ: http://192.168.1.146:3000)_

1.  Truy cập link trên điện thoại.
2.  Nhập **Lucky Number** (số báo danh/số vé) của mình.
3.  Chờ màn hình "Waiting for Race".
4.  Khi đua bắt đầu: **Bấm liên tục vào nút "TAP!"** để cổ vũ (và xả stress, kết quả đua không phụ thuộc vào tap).

### 💻 Dành Cho MC / Màn Hình Chiếu (Admin)

Truy cập link sau trên Laptop điều khiển (kết nối với máy chiếu):

> **http://[IP-MÁY-CHỦ]:3000/admin**

---

## 4. Kịch Bản Vận Hành (Flow Game)

1.  **Chờ đợi (Waiting Phase)**:
    - Màn hình chiếu: Hiển thị trạng thái chờ, logo chương trình (có thể tùy biến).
    - MC hô hào mọi người đăng nhập.
    - Admin kiểm tra số lượng kết nối (Status: Connected).

2.  **Bắt đầu Đua (Racing Phase)**:
    - Admin chọn giải muốn chơi ở cột bên trái (Ví dụ: "Start Giải Nhì").
    - Hệ thống đếm ngược 5s ngầm (để sync).
    - **Lên Nhạc! 🎵** (Nhạc nền tự bật hoặc MC bật).
    - Trên màn hình chiếu: Ngựa bắt đầu chạy.
    - Trên điện thoại khán giả: Hiện nút **TAP!** khổng lồ.

3.  **Kết Thúc & Trao Giải (Result Phase)**:
    - Khi ngựa về đích, hiệu ứng Pháo hoa (Confetti) sẽ nổ.
    - Bảng danh sách **Winner (Lucky Numbers)** sẽ hiện lên giữa màn hình.
    - Đồng thời hiện bảng **Top Tappers** (những người bấm nhiệt tình nhất) ở góc phải để vinh danh tinh thần.

4.  **Reset**:
    - Sau khi trao giải xong, Admin bấm nút đỏ **"Reset System"**.
    - Hệ thống quay về trạng thái Waiting, sẵn sàng cho giải tiếp theo.

---

## 5. Xử Lý Sự Cố (Troubleshooting)

| Vấn đề                        | Nguyên nhân & Cách khắc phục                                                                                                                    |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Không truy cập được Link**  | 1. Kiểm tra xem điện thoại và Server có chung Wifi không.<br>2. Tắt Firewall trên máy Server.<br>3. Kiểm tra lại IP máy Server có bị đổi không. |
| **Server báo lỗi EADDRINUSE** | Cổng 3000 đang bị chiếm. Chạy lại lệnh `npm run start:clean` để hệ thống tự kill process cũ.                                                    |
| **Màn hình bị trắng/crash**   | Bấm Reload (F5) lại trang web. App có cơ chế tự kết nối lại (Auto Reconnect).                                                                   |
| **Ngựa chạy không mượt**      | Do trình duyệt máy chiếu yếu. Hãy dùng Chrome/Edge bản mới nhất và bật "Hardware Acceleration".                                                 |

---

## 6. Lệnh Tiện Ích Khác

- `npm run stress-test`: Giả lập 50 người chơi để test chịu tải.
- `npm run clean:port`: Chỉ tắt server thủ công.
