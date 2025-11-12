const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('config');
const CustomerModel = require('../apps/models/customer'); // Dùng Customer Model

// Cấu hình dựa trên biến trong config/app.js
const GOOGLE_CONFIG = config.get('app.googleClientID') ? {
    clientID: config.get('app.googleClientID'),
    clientSecret: config.get('app.googleClientSecret'),
    // URI chuyển hướng đã đăng ký ở Google Console
    callbackURL: "/auth/google/callback", 
    scope: ['profile', 'email'],
} : null;

// Cấu hình Facebook
const FACEBOOK_CONFIG = config.get('app.facebookClientID') ? {
    clientID: config.get('app.facebookClientID'),
    clientSecret: config.get('app.facebookClientSecret'),
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails', 'photos'],
} : null;

// --- 1. Serialization (Lưu ID vào session) ---
passport.serializeUser((customer, done) => {
    done(null, customer._id); 
});

// --- 2. Deserialization (Tìm user bằng ID từ session) ---
passport.deserializeUser(async (id, done) => {
    try {
        const customer = await CustomerModel.findById(id);
        done(null, customer);
    } catch (err) {
        done(err, null);
    }
});


// --- 3. Chiến lược Google OAuth ---
if (GOOGLE_CONFIG) {
    passport.use(new GoogleStrategy(GOOGLE_CONFIG,
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let customer = await CustomerModel.findOne({ email });

                if (!customer) {
                    // Nếu chưa có, tạo tài khoản mới. 
                    // Yêu cầu bắt buộc phải có password, nên ta tạo password ngẫu nhiên.
                    const bcrypt = require('bcrypt');
                    const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 10);
                    
                    customer = await CustomerModel.create({
                        fullName: profile.displayName,
                        email: email,
                        password: hashedPassword, // Mật khẩu giả để đáp ứng schema
                        phone: 'GG_N/A', // Ghi chú để dễ nhận biết
                        address: 'GG_N/A',
                    });
                }
                // Trả về đối tượng customer đã tạo hoặc tìm thấy
                return done(null, customer); 
            } catch (error) {
                return done(error, null);
            }
        }
    ));
}

// --- 4. Chiến lược Facebook OAuth ---
if (FACEBOOK_CONFIG) {
    passport.use(new FacebookStrategy(FACEBOOK_CONFIG,
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
                let customer = await CustomerModel.findOne({ email });

                if (!customer) {
                    const bcrypt = require('bcrypt');
                    const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 10);
                    
                    customer = await CustomerModel.create({
                        fullName: profile.displayName,
                        email: email,
                        password: hashedPassword,
                        phone: 'FB_N/A',
                        address: 'FB_N/A',
                    });
                }
                return done(null, customer);
            } catch (error) {
                return done(error, null);
            }
        }
    ));
}

module.exports = passport;