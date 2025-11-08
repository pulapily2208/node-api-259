const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require('path');
const config = require("config");
const redisClient = require("../libs/redis.token");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: true, 
    credentials: true 
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../../public')));
app.use('/static/admin', express.static(path.join(__dirname, '../../public/admin')));

app.use(config.get("app.prefixApiVersion"), require("../routers/web"));
module.exports = app;