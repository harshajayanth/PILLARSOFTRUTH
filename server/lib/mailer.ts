import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const GMAIL_PASS_KEY= process.env.GMAIL_PASSKEY || "";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: ADMIN_EMAIL,
    pass: GMAIL_PASS_KEY,
  },
});