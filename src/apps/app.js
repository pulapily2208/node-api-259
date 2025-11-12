const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require('path');
const config = require("config");
const redisClient = require("../libs/redis.token");
const cors = require("cors");
const session = require('express-session'); 
const passport = require('../common/passport');
const flash = require('connect-flash'); 
const app = express();
const SettingModel = require("./models/setting");

// Cấu hình CORS
app.use(cors({
    origin: true, 
    credentials: true 
}));

// Cấu hình View Engine cho EJS
app.set("views", path.join(__dirname, "views")); 
app.set("view engine", "ejs");

// Parse JSON bodies (for API requests)
app.use(bodyParser.json());
// Parse URL-encoded bodies (for HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Cấu hình Session
app.use(session({
    secret: config.get('app.sessionSecret'), 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        secure: app.get('env') === 'production', 
    } 
}));


app.use(flash());


// Inject global settings (logo, footer, etc.) into all views
app.use(async (req, res, next) => {
    try {
        let setting = await SettingModel.findOne().lean();
        if (!setting) {
            setting = {
                shop_name: "Vietpro Shop",
                thumbnail_logo: "logo/default-logo.png",
                description: "",
                copyright: "© 2025 MyWebsite. All rights reserved."
            };
        }
        res.locals.setting = setting;
    } catch (e) {
        // Fallback defaults if database query fails
        res.locals.setting = {
            shop_name: "Vietpro Shop",
            thumbnail_logo: "logo/default-logo.png",
            description: "",
            copyright: "© 2025 MyWebsite. All rights reserved."
        };
    }
    // Inject current URL for active menu highlighting
    res.locals.currentUrl = req.path;
    next();
});


app.use((req, res, next) => {
    const ct = req.headers['content-type'] || req.headers['Content-Type'];
    if (ct && typeof ct === 'string' && ct.indexOf('multipart/form-data') === 0) {
        console.log('Incoming multipart request. Content-Type header:', ct);
        console.log('Request headers snapshot:', {
            host: req.headers.host,
            connection: req.headers.connection,
            'user-agent': req.headers['user-agent'],
            accept: req.headers.accept,
            'content-length': req.headers['content-length'],
            'content-type': req.headers['content-type']
        });
    }
    next();
});


// Serve static files
app.use(passport.initialize());
app.use(passport.session());

const PUBLIC_ROOT = path.join(__dirname, '../public');
app.use('/public', express.static(PUBLIC_ROOT));
app.use('/static', express.static(PUBLIC_ROOT));
app.use('/static/admin', express.static(path.join(PUBLIC_ROOT, 'admin')));
app.use('/admin', express.static(path.join(PUBLIC_ROOT, 'admin')));
app.use('/upload', express.static(path.join(PUBLIC_ROOT, 'upload')));
// Backward-compat alias for legacy templates that used "/uploads"
app.use('/uploads', express.static(path.join(PUBLIC_ROOT, 'upload')));


// Router API 
app.use(config.get("app.prefixApiVersion"), require("../routers/web"));

// Router cho các trang Web/Admin EJS
app.use("/", require("../routers/site")); 

module.exports = app;