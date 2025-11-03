const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("config");
const redisClient = require("../libs/redis.token");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(config.get("app.prefixApiVersion"), require("../routers/web"));
module.exports = app;
