# HƯỚNG DẪN CẤU HÌNH ĐĂNG NHẬP GOOGLE & FACEBOOK

## 📋 TỔNG QUAN

Dự án đã tích hợp sẵn đăng nhập bằng:
- ✅ **Google OAuth 2.0**
- ✅ **Facebook Login**

## 🔧 CÁCH CẤU HÌNH

### 1️⃣ CẤU HÌNH GOOGLE OAUTH

#### Bước 1: Tạo Google Cloud Project
1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** → **Credentials**

#### Bước 2: Tạo OAuth 2.0 Client ID
1. Click **Create Credentials** → **OAuth client ID**
2. Chọn **Application type**: **Web application**
3. Đặt tên: `Vietpro Mobile Shop`
4. Thêm **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```
5. Click **Create** và lưu lại:
   - **Client ID**
   - **Client Secret**

#### Bước 3: Cấu hình trong .env
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

---

### 2️⃣ CẤU HÌNH FACEBOOK LOGIN

#### Bước 1: Tạo Facebook App
1. Truy cập: https://developers.facebook.com/apps/
2. Click **Create App**
3. Chọn **Use case**: **Authenticate and request data from users**
4. Đặt tên app: `Vietpro Mobile Shop`
5. Chọn **Add Product** → **Facebook Login**

#### Bước 2: Cấu hình Facebook Login
1. Vào **Facebook Login** → **Settings**
2. Thêm **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/auth/facebook/callback
   https://yourdomain.com/auth/facebook/callback
   ```
3. Lưu thay đổi

#### Bước 3: Lấy App ID và App Secret
1. Vào **Settings** → **Basic**
2. Lưu lại:
   - **App ID**
   - **App Secret** (click Show để xem)

#### Bước 4: Cấu hình trong .env
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef0123456789abcdef0123456789
```

---

## 🚀 CÁCH SỬ DỤNG

### Test trên Local (localhost:3000)

1. **Copy file cấu hình:**
   ```bash
   cp .env.example .env
   ```

2. **Điền thông tin vào .env:**
   ```env
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   FACEBOOK_CLIENT_ID=your_actual_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_actual_facebook_app_secret
   ```

3. **Khởi động server:**
   ```bash
   npm start
   ```

4. **Truy cập trang login:**
   ```
   http://localhost:3000/login
   ```

5. **Click vào nút:**
   - **"Đăng nhập bằng Google"** (màu đỏ)
   - **"Đăng nhập bằng Facebook"** (màu xanh)

---

## 🔄 LUỒNG HOẠT ĐỘNG

### Google OAuth Flow:
```
User click "Đăng nhập bằng Google"
    ↓
Redirect to Google Login
    ↓
User đăng nhập tài khoản Google
    ↓
Google redirect về: /auth/google/callback
    ↓
Server nhận profile từ Google (email, name)
    ↓
Tìm hoặc tạo Customer trong DB
    ↓
Tạo JWT token (accessToken + refreshToken)
    ↓
Trả về response hoặc redirect
```

### Facebook OAuth Flow:
```
User click "Đăng nhập bằng Facebook"
    ↓
Redirect to Facebook Login
    ↓
User đăng nhập tài khoản Facebook
    ↓
Facebook redirect về: /auth/facebook/callback
    ↓
Server nhận profile từ Facebook (email, name)
    ↓
Tìm hoặc tạo Customer trong DB
    ↓
Tạo JWT token (accessToken + refreshToken)
    ↓
Trả về response hoặc redirect
```

---

## 📝 LƯU Ý QUAN TRỌNG

### 1. Callback URLs phải khớp chính xác
- Google: `http://localhost:3000/auth/google/callback`
- Facebook: `http://localhost:3000/auth/facebook/callback`

### 2. Khi deploy lên production
- Thêm domain thật vào Authorized URIs:
  ```
  https://yourdomain.com/auth/google/callback
  https://yourdomain.com/auth/facebook/callback
  ```

### 3. Facebook yêu cầu HTTPS cho production
- Local (localhost) có thể dùng HTTP
- Production BẮT BUỘC phải dùng HTTPS

### 4. Quyền truy cập (Scopes)
- **Google**: `profile`, `email` (đã cấu hình)
- **Facebook**: `email` (đã cấu hình)

### 5. Tự động tạo tài khoản
- Nếu email chưa tồn tại → Tự động tạo Customer mới
- Password ngẫu nhiên (user không cần biết)
- Phone: `GG_N/A` (Google) hoặc `FB_N/A` (Facebook)

---

## 🧪 TEST BẰNG POSTMAN

### Test Google Login (Manual)
Không thể test trực tiếp qua Postman vì cần browser để Google OAuth redirect.

**Cách test:**
1. Mở browser: `http://localhost:3000/login`
2. Click "Đăng nhập bằng Google"
3. Đăng nhập tài khoản Google
4. Xem response trả về (có accessToken)

### Test Facebook Login (Manual)
Tương tự Google, cần browser để Facebook redirect.

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Redirect URI mismatch"
**Nguyên nhân:** Callback URL không khớp với cấu hình trong Google/Facebook Console.

**Giải pháp:**
- Kiểm tra lại URL trong Google Cloud Console / Facebook Developer Console
- Đảm bảo có http:// hoặc https://
- Không có dấu `/` ở cuối URL

### Lỗi: "App Not Setup"
**Nguyên nhân:** Chưa thêm Facebook Login product vào app.

**Giải pháp:**
- Vào Facebook Developer Console
- Click **Add Product** → **Facebook Login**
- Cấu hình Valid OAuth Redirect URIs

### Lỗi: "Invalid Client ID"
**Nguyên nhân:** GOOGLE_CLIENT_ID hoặc FACEBOOK_CLIENT_ID sai.

**Giải pháp:**
- Kiểm tra lại file `.env`
- Copy lại đúng Client ID từ Console
- Restart server sau khi sửa `.env`

---

## 📚 TÀI LIỆU THAM KHẢO

- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Facebook Login**: https://developers.facebook.com/docs/facebook-login/web
- **Passport.js Google Strategy**: http://www.passportjs.org/packages/passport-google-oauth20/
- **Passport.js Facebook Strategy**: http://www.passportjs.org/packages/passport-facebook/

---

## ✅ CHECKLIST HOÀN THIỆN

- [x] Code Passport strategies (Google + Facebook)
- [x] Tạo routes `/auth/google` và `/auth/facebook`
- [x] Tạo callback routes
- [x] Khởi tạo passport trong app.js
- [x] Thêm nút đăng nhập vào login.ejs
- [x] Tạo file .env.example
- [x] Viết tài liệu hướng dẫn

**🎉 HOÀN THIỆN 100%! Chỉ cần cấu hình Client ID/Secret là có thể sử dụng!**
