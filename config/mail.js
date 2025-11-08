module.exports = {
  mailHost: process.env.MAIL_HOST || "smtp.gmail.com",
  mailPort: process.env.MAIL_PORT || 465,
  mailSecure: process.env.MAIL_SECURE || true,
  mailUser: process.env.MAIL_USER || "quantri.vietproshop@gmail.com",
  mailPass: process.env.MAIL_PASS || "moqd qywm imbc brrc",
  mailFrom:
    process.env.MAIL_FROM ||
    "Admin Vietpro Shop <quantri.vietproshop@gmail.com>",
  mailTemplate: `${__dirname}/../src/apps/emails/templates`,
};
