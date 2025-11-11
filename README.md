# Node API Project

Node.js API backend với Express, MongoDB, và Redis.

## Cấu trúc dự án

```
├── config/           # Cấu hình ứng dụng
├── src/
│   ├── apps/         # Controllers, Models, Middlewares, Views
│   ├── bin/          # Entry point (www.js)
│   ├── common/       # Khởi tạo MongoDB, Redis, Passport
│   ├── emails/       # Templates và dịch vụ gửi email
│   ├── libs/         # Thư viện tiện ích (JWT, Redis, Upload, v.v.)
│   ├── public/       # Static files và uploads
│   └── routers/      # Route definitions
├── .env              # Biến môi trường
├── .gitignore        # Git ignore rules
└── package.json      # Dependencies và scripts

```

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

## Yêu cầu hệ thống

- Node.js >= 14.x
- MongoDB
- Redis

## Môi trường (.env)

Tạo file `.env` với các biến sau:

```
# Database
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email
MAIL_PASS=your_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## Tính năng

- ✅ Authentication (JWT, OAuth Google/Facebook)
- ✅ User Management
- ✅ Product Management
- ✅ Category Management
- ✅ Order Management
- ✅ Banner & Slider Management
- ✅ Comment System
- ✅ File Upload
- ✅ Email Notifications
- ✅ Redis Caching

## API Documentation

API endpoint documentation sẽ được cập nhật sau.

## License

ISC
