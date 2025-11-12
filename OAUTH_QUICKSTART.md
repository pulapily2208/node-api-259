# 🔐 ĐĂNG NHẬP GOOGLE & FACEBOOK - HƯỚNG DẪN NHANH

## ✅ ĐÃ HOÀN THIỆN

Dự án đã **tích hợp sẵn** đăng nhập bằng:
- 🔴 **Google OAuth 2.0** 
- 🔵 **Facebook Login**

Giao diện đã có 2 nút màu trên trang `/login`

---

## ⚡ CẤU HÌNH NHANH 3 BƯỚC

### Bước 1: Tạo Google App
1. Vào: https://console.cloud.google.com/apis/credentials
2. Tạo **OAuth 2.0 Client ID**
3. Thêm redirect URI: `http://localhost:3000/auth/google/callback`
4. Lưu **Client ID** và **Client Secret**

### Bước 2: Tạo Facebook App  
1. Vào: https://developers.facebook.com/apps/
2. Tạo app → Chọn **Facebook Login**
3. Thêm redirect URI: `http://localhost:3000/auth/facebook/callback`
4. Lưu **App ID** và **App Secret**

### Bước 3: Cấu hình .env
```bash
# Copy file mẫu
cp .env.example .env

# Điền vào .env:
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

**Restart server → XONG!**

---

## 🧪 TEST NGAY

1. Chạy server: `npm start`
2. Mở: http://localhost:3000/login
3. Click nút **"Đăng nhập bằng Google"** (màu đỏ)
4. Hoặc click **"Đăng nhập bằng Facebook"** (màu xanh)

---

## 📁 FILES QUAN TRỌNG

- **Passport Config**: `src/common/passport.js` (Google + Facebook strategies)
- **Routes**: `src/routers/site.js` (4 routes OAuth)
- **Controller**: `src/apps/controllers/apis/customerAuth.js` (socialLoginCallback)
- **Login View**: `src/apps/views/admin/login.ejs` (2 nút đăng nhập)
- **Environment**: `.env` (Client ID + Secret)

---

## 🔄 LUỒNG HOẠT ĐỘNG

```
User click nút → Redirect to Google/Facebook 
→ User đăng nhập 
→ Callback về server 
→ Tạo/tìm Customer 
→ Tạo JWT token 
→ Trả về accessToken
```

---

## 💡 LƯU Ý

- ✅ Tự động tạo tài khoản nếu email chưa tồn tại
- ✅ Password ngẫu nhiên (user không cần biết)
- ✅ Phone: `GG_N/A` (Google) hoặc `FB_N/A` (Facebook)
- ⚠️ Callback URL phải khớp CHÍNH XÁC
- ⚠️ Production cần HTTPS (localhost dùng HTTP được)

---

## 📚 Chi tiết đầy đủ

Xem file: **OAUTH_SETUP_GUIDE.md**

---

**🎉 SẴN SÀNG SỬ DỤNG! Chỉ cần cấu hình Client ID/Secret!**
