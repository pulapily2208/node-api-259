const nodemailer = require("nodemailer");
const ejs = require("ejs");
const config = require("config");
const transporter = nodemailer.createTransport({
  host: config.get("mail.mailHost"),
  port: config.get("mail.mailPort"),
  secure: config.get("mail.mailSecure"), // true for 465, false for other ports
  auth: {
    user: config.get("mail.mailUser"),
    pass: config.get("mail.mailPass"),
  },
});

const sendMail = async (template, payload) => {
  const html = await ejs.renderFile(template, { payload });
  transporter.sendMail({
    from: config.get("mail.mailFrom"),
    to: payload.email,
    subject: payload.subject,
    html,
  });
};
module.exports = sendMail;
