const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("config");
const path = require("path");

const app = express();

// Cấu hình EJS View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(cookieParser());

// Router cho Web Views (sẽ chạy ở '/')
app.use("/", require("../routers/view")); 

// Router cho API
app.use(config.get("app.prefixApiVersion"), require("../routers/web"));

module.exports = app;