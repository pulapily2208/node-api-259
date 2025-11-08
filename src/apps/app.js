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

// Log Content-Type for multipart requests to help debug malformed part header
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

// Note: file upload is handled per-route by `src/apps/middlewares/upload.js` using formidable

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../../public')));
app.use('/static/admin', express.static(path.join(__dirname, '../../public/admin')));

app.use(config.get("app.prefixApiVersion"), require("../routers/web"));
module.exports = app;