const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const config = require("config");
const path = require("path"); 
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
app.use("/static/admin", express.static(path.join(__dirname, "../public/admin"))); 
app.use("/uploads", express.static(path.join(__dirname, "../public/upload")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
    secret: 'YOUR_SESSION_SECRET', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } 
}));

app.use(flash());

app.use("/", require("../routers/view")); 
app.use(config.get("app.prefixApiVersion"), require("../routers/web"));

module.exports = app;