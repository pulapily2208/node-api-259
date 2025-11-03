const nodemailer = require("nodemailer");
const ejs = require("ejs");
const config = require("config");
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: config.get("mail.mailHost"),
  port: config.get("mail.mailPort"),
  secure: config.get("mail.mailSecure"),
  auth: {
    user: config.get("mail.mailUser"),
    pass: config.get("mail.mailPass"),
  },
});

// Wrap in an async IIFE so we can use await.
module.exports = async (template, payload) => {
  const html = await ejs.renderFile(template, { payload });
  const info = await transporter.sendMail({
    from: config.get("mail.mailFrom"),
    to: payload.email,
    subject: payload.subject,
    html,
  });
};
