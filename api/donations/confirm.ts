// api/confirmDonation.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../../server/utils/googleDrive.js";
import { transporter } from "../lib/mailer.js";

const DONATION_SHEET_ID = process.env.GOOGLE_DONATIONS_SHEET_ID!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "pillarsoftruth.coc@gmail.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { uniqueId } = req.body;
    if (!uniqueId) {
      return res.status(400).json({ message: "Missing uniqueId" });
    }

    // ✅ Fetch all rows from Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DONATION_SHEET_ID,
      range: "Sheet1",
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(500).json({ message: "No donation data available" });
    }

    // ✅ Normalize headers
    const headers = rows[0].map((h) => h.trim());
    const idIndex = headers.indexOf("UniqueId");
    const confirmedIndex = headers.indexOf("Confirmed");

    if (idIndex === -1 || confirmedIndex === -1) {
      return res.status(500).json({
        message: "Sheet missing required columns (UniqueId / Confirmed)",
      });
    }

    // ✅ Find the donation row
    const targetRowIndex = rows.findIndex(
      (row, idx) => idx !== 0 && row[idIndex] === uniqueId
    );
    if (targetRowIndex === -1) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // ✅ Update the Confirmed column → TRUE
    const updateRange = `Sheet1!${String.fromCharCode(
      65 + confirmedIndex
    )}${targetRowIndex + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: DONATION_SHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["true"]],
      },
    });

    // ✅ Construct donor data
    const row = rows[targetRowIndex];
    const data = Object.fromEntries(
      headers.map((h, i) => [h, row[i]?.toString().trim() || ""])
    );

    if (!data.Email) {
      return res.status(400).json({ message: "Missing email for donor" });
    }

    // ✅ Send confirmation email
    const mailOptions = {
      from: ADMIN_EMAIL,
      to: data.Email,
      subject: "Donation Successfully Received - Pillars of Truth",
      html: `
        <h2>Thank You for Your Donation!</h2>
        <p>Dear <strong>${data.Name}</strong>,</p>
        <p>We have successfully received your donation.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Amount:</strong> ₹${data.Amount}</li>
          <li><strong>Purpose:</strong> ${data.Purpose}</li>
          <li><strong>Date:</strong> ${data.TimeStamp}</li>
          <li><strong>Reference ID:</strong> ${data.UniqueId}</li>
        </ul>
        <p>We truly appreciate your support and generosity.</p>
        <p>Warm regards,<br/>Pillars of Truth Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Donation confirmed and email sent",
    });
  } catch (err) {
    console.error("Failed to update donation:", err);
    return res.status(500).json({ message: "Failed to update donation" });
  }
}
