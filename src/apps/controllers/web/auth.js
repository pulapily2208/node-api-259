const axios = require('axios');
const config = require('config');

exports.loginForm = (req, res) => {
  if (req.session && req.session.user) return res.redirect('/admin');
  
  // Lấy email đã nhớ từ cookie
  const rememberedEmail = req.cookies.rememberedEmail || '';
  
  return res.render('admin/login', { 
    error: req.flash('errors')?.[0]?.msg,
    rememberedEmail
  });
};

exports.login = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const apiUrl = `${baseUrl}${config.get('app.prefixApiVersion')}/auth/users/login`;
    const { email, password, remember } = req.body;
    
    console.log('Web Login Attempt:', { email, apiUrl, remember: !!remember });
    
    const response = await axios.post(apiUrl, { email, password });
    const { data: user, accessToken } = response.data;
    
    console.log('Login Success:', { userId: user._id, email: user.email, token: accessToken ? 'exists' : 'missing' });
    
    req.session.user = user;
    req.session.accessToken = accessToken;
    
    // Xử lý "Remember Me"
    if (remember) {
      // Lưu email vào cookie với thời hạn 30 ngày
      res.cookie('rememberedEmail', email, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
        httpOnly: true 
      });
    } else {
      // Xóa cookie nếu không chọn remember
      res.clearCookie('rememberedEmail');
    }
    
    // Explicitly save session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        req.flash('errors', [{ msg: 'Lỗi lưu phiên đăng nhập. Vui lòng thử lại.' }]);
        return res.redirect('/login');
      }
      console.log('Session saved successfully with token:', !!accessToken);
      return res.redirect('/admin');
    });
  } catch (error) {
    console.error('Login Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    const msg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
    req.flash('errors', [{ msg }]);
    return res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

// Trang tài khoản hiện tại
exports.account = (req, res) => {
  const user = req.session?.user;
  if (!user) return res.redirect('/login');
  return res.render('admin/account', {
    title: 'Tài khoản của tôi',
    user,
    success: req.flash('success')?.[0] || '',
    error: req.flash('error')?.[0] || ''
  });
};
