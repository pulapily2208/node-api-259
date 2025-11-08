const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("config");
const redisClient = require("../libs/redis.token");
const cors = require("cors");

const app = express();

// Cấu hình CORS
// Origin: true cho phép mọi nguồn, bạn nên thay bằng địa chỉ Frontend cụ thể khi triển khai thật.
app.use(cors({
    origin: true, 
    credentials: true // Bắt buộc phải có để cho phép gửi/nhận cookies (refreshToken)
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(config.get("app.prefixApiVersion"), require("../routers/web"));
module.exports = app;