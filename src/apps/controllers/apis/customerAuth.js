const CustomerModel = require("../../models/customer");
const { addTokenBlackList } = require("../../../libs/redis.token");
const jwt = require("../../../libs/jwt");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { deleteCustomerToken } = require ("../../../libs/token.service");
const { storeCustomerToken } = require ("../../../libs/token.service");

const sendMail = require("../../../emails/mail"); 
const config = require("config");
const path = require("path"); // Cần thiết nếu dùng path.join

exports.register = async (req, res) => {
  try {
    // Validate form
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validator customer",
        errors: errors.array(),
      });
    }
    const { fullName, email, password, phone, address } = req.body;
    // Validate unique email
    const emailExists = await CustomerModel.findOne({ email });
    if (emailExists)
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    // Validate unique password
    const phoneExists = await CustomerModel.findOne({ phone });
    if (phoneExists)
      return res.status(400).json({
        status: "error",
        message: "Phone already exists",
      });
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = await CustomerModel.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    const mailTemplatePath = `${config.get("mail.mailTemplate")}/mail-register.ejs`;
    await sendMail(mailTemplatePath, {
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        subject: "Xác nhận đăng ký tài khoản khách hàng thành công - Vietpro Shop",
        accountType: "Khách hàng",
    }).catch(console.error);
    return res.status(201).json({
      status: "success",
      message: "Registered customer successfully",
      data: newCustomer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check email
    const isEmail = await CustomerModel.findOne({ email });
    if (!isEmail)
      return res.status(400).json({
        status: "error",
        message: "Invalid email",
      });

    // Check password
    const isPassword = await bcrypt.compare(password, isEmail.password);
    if (!isPassword)
      return res.status(400).json({
        status: "error",
        message: "Invalid password",
      });

    if (isEmail && isPassword) {
      // Generate Token
      const accessToken = await jwt.generateAccessToken(isEmail);
      const refreshToken = await jwt.generateRefreshToken(isEmail);
      const { password, ...others } = isEmail.toObject();

      // Insert Token to database
      storeCustomerToken(others._id, accessToken, refreshToken);


      // Response Token & Customer
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAg: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        customer: others,
        accessToken,
      });
    }
  } catch (error) {
    return res.status(500).json({
      ststus: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.logout = async (req, res) => {
  try {
    const { customer } = req;
    // Di chuyển Token ( accessToken, refreshToken) vào Redis
    await addTokenBlackList (customer.id);
    // Xóa token trong db 
    deleteCustomerToken(customer.id)
    return res.status(200).json({
      status: " success",
      message: " Logout successfully",
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const customer = await CustomerModel.findOne({ email });

    // Trả về thông báo thành công chung để tránh lộ thông tin email
    if (!customer) {
      return res.status(200).json({
        status: "success",
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // 1. Tạo token đặt lại mật khẩu bằng hàm từ libs/jwt.js
    const resetToken = await jwt.generateResetToken(customer);
    
    // 2. Xây dựng liên kết đặt lại mật khẩu (Thay thế URL frontend của bạn)
    const frontendBaseUrl = "http://localhost:3000"; 
    const resetURL = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${email}`;
    
    // 3. Gửi email
    const mailTemplatePath = `${config.get("mail.mailTemplate")}/mail-resetPass.ejs`;
    
    await sendMail(mailTemplatePath, {
      email: customer.email,
      subject: "Yêu cầu Đặt lại Mật khẩu",
      fullName: customer.fullName,
      resetURL,
    }).catch(console.error);

    return res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error during forgot password",
      error: error.message,
    });
  }
};


// --- CHỨC NĂNG ĐẶT LẠI MẬT KHẨU (RESET PASSWORD) ---
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    // 1. Xác thực token
    let decoded;
    try {
        const resetKey = config.get("app.jwtResetKey");
        decoded = await jwt.verify(token, resetKey); 
    } catch (e) {
        return res.status(400).json({
            status: "error",
            message: "Invalid or expired token.",
        });
    }

    // 2. Tìm customer bằng ID từ token và email
    const customer = await CustomerModel.findOne({ _id: decoded.id, email });
    if (!customer) {
      return res.status(404).json({
        status: "error",
        message: "User not found or token mismatched.",
      });
    }
    
    // 3. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Cập nhật mật khẩu
    customer.password = hashedPassword;
    await customer.save();
    
    // 5. Vô hiệu hóa tất cả token cũ
    await addTokenBlackList(customer._id);
    deleteCustomerToken(customer._id);


    return res.status(200).json({
      status: "success",
      message: "Password reset successfully. Please login with your new password.",
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error during password reset",
      error: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { customer } = req;
    const accessToken = await jwt.generateAccessToken(customer);
    return res.status(200).json({
      status: "success",
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({
      ststus: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getMe = async (req, res) => {
  try {
    const { customer } = req;
    res.status(200).json({
      status: "success",
      message: "User profile retrieved successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      ststus: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

// XỬ LÝ CALLBACK SAU KHI ĐĂNG NHẬP BẰNG GOOGLE/FACEBOOK ---
exports.socialLoginCallback = async (req, res) => {
  try {
    // Passport.js đã đặt đối tượng customer (đã được deserialize) vào req.user
    const customer = req.user;
    
    if (!customer) {
        // Chuyển hướng nếu Passport.authenticate thất bại
        return res.redirect("/api/v3/auth/login-failure"); 
    }

    // TẠO JWT VÀ TRẢ VỀ CHO FRONTEND (Sử dụng logic tương tự như exports.login)
    const accessToken = await jwt.generateAccessToken(customer);
    const refreshToken = await jwt.generateRefreshToken(customer);
    
    // Lưu Token vào DB
    await storeCustomerToken(customer._id, accessToken, refreshToken);
    
    // Gửi Refresh Token qua Cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });
    
    // Chuyển hướng về Frontend với Access Token trong URL
    // (Thay thế http://localhost:8080 bằng URL Frontend của bạn)
    // return res.redirect(`http://localhost:8080/login-success?accessToken=${accessToken}&customerId=${customer._id}`);
    return res.status(200).json({
        status: "success",
        message: "Social login success. JWT generated.",
        customer: customer,
        accessToken: accessToken,
        refreshTokenCookie: "Set in header" 
    });
  } catch (error) {
    console.error("Social Login Callback Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during social login callback",
      error: error.message,
    });
  }
};