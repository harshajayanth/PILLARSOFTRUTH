import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js"; // ✅ shared auth
import { v4 as uuidv4 } from "uuid";
import { transporter } from "./lib/mailer.js";
import { contactFormSchema } from "../shared/schema.js"; 


const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";




export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Validate request body
    const validation = contactFormSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid form data",
        errors: validation.error.errors,
      });
    }

    const formData = validation.data;

    // ✅ Fetch existing emails from Google Sheet
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A2:C`, // Assuming col C = email
    });

    const rows = existingData.data.values || [];
    const existingEmails = rows
      .map((row: any) => row[2])
      .filter((email: string | undefined) => email && email !== "email")
      .map((email: string) => email.toLowerCase());

    const incomingEmail = formData.email.toLowerCase();

    if (existingEmails.includes(incomingEmail)) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // ✅ Generate new user row
    const newId = uuidv4();
    const newUser = [
      newId,
      `${formData.firstName} ${formData.lastName}`, // username
      formData.email,
      "user", // default role
      formData.phone || "",
      formData.ageGroup || "",
      formData.hearAbout || "",
      formData.message || "",
      "inactive", // default access status
    ];

    // ✅ Append new user to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_USERS,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newUser],
      },
    });

    // ✅ Send email notification to admin
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: "New Community Member Application",
      html: `
        <h2>New Community Member Application</h2>
        <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
        <p><strong>Age Group:</strong> ${formData.ageGroup || "Not provided"}</p>
        <p><strong>Heard about us:</strong> ${formData.hearAbout || "Not specified"}</p>
        <p><strong>Message:</strong> ${formData.message || "No message"}</p>
      `,
    });

    // ✅ Send confirmation email to user
    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: formData.email,
      subject: "Welcome to Pillars of Truth Community!",
      html: `
        <h2>Thank you for your interest!</h2>
        <p>Dear ${formData.firstName},</p>
        <p>Thank you for applying to join our Pillars of Truth youth community. We have received your application and will review it shortly.</p>
        <p>One of our team members will contact you within the next few days to discuss the next steps.</p>
        <p>May God bless you as you seek to grow in His word!</p>
        <p>In Christ,<br>Pillars of Truth Team</p>
      `,
    });

    return res.json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ message: "Failed to submit application" });
  }
}
