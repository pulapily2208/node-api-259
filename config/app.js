module.exports = {
  serverPort: process.env.SERVER_PORT || 3000,
  prefixApiVersion: process.env.PREFIX_API_VERSION || "/api/v3",
  jwtAccessKey: process.env.JWT_ACCESS_KEY || "vietpro_access_key",
  jwtRefreshKey: process.env.JWT_REFRESH_KEY || "vietpro_refresh_key",
  jwtResetKey: process.env.JWT_RESET_KEY || "vietpro_reset_key_strong_secret",
  // KHÓA CHO GOOGLE OAUTH
  googleClientID: process.env.GOOGLE_CLIENT_ID ,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,

  // KHÓA CHO FACEBOOK OAUTH
  facebookClientID: process.env.FACEBOOK_CLIENT_ID ,
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET ,
  
  sessionSecret: process.env.SESSION_SECRET || "vietpro_session_secret_key_default",
};
