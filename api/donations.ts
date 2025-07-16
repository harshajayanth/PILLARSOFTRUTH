import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js";
import { transporter } from "./lib/mailer.js";
import { v4 as uuidv4 } from "uuid";

const DONATION_SHEET_ID = process.env.GOOGLE_DONATIONS_SHEET_ID || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { uniqueId, name, email, phone, amount, purpose, confirmed } =
      req.body;

    // ✅ Basic validation
    if (!name || !email || !amount || !purpose) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Generate unique ID if not provided
    const donationId = uniqueId || uuidv4();
    const timestamp = new Date().toLocaleString();

    const row = [
      donationId,
      name,
      email,
      phone || "",
      amount,
      purpose,
      timestamp,
      confirmed === true ? "true" : "false",
    ];

    // ✅ Append donation row to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: DONATION_SHEET_ID,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    // ✅ Notify admin about new donation
    const mailOptions = {
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Donation Received - ${name}`,
      html: `
        <h2>New Donation Recorded</h2>
        <p><strong>Donor Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Confirmed:</strong> ${confirmed ? "Yes" : "No"}</p>
        <p><strong>Unique ID:</strong> ${donationId}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Donation recorded successfully",
      id: donationId,
    });
  } catch (err) {
    console.error("Failed to record donation:", err);
    return res.status(500).json({ message: "Failed to record donation" });
  }
}
