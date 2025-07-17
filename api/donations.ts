import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js";
import { transporter } from "../server/lib/mailer.js";
import { v4 as uuidv4 } from "uuid";

const DONATION_SHEET_ID = process.env.GOOGLE_DONATIONS_SHEET_ID || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "pillarsoftruth.coc@gmail.com";
const SHEET_NAME = "Sheet1"; // Change if needed

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case "GET":
      return handleGetDonations(req, res);
    case "POST":
      return handleAddDonation(req, res);
    case "PUT":
      return handleConfirmDonation(req, res);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

//
// ✅ GET → Fetch all donation records
//
async function handleGetDonations(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DONATION_SHEET_ID,
      range: SHEET_NAME,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return res.json([]);

    const headers = rows[0];
    const donations = rows.slice(1).map((row) => {
      const entry: Record<string, string> = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] || "";
      });
      return entry;
    });

    return res.status(200).json(donations);
  } catch (err) {
    console.error("❌ Failed to fetch donations:", err);
    return res.status(500).json({ message: "Failed to fetch donations" });
  }
}

//
// ✅ POST → Add a new donation
//
async function handleAddDonation(req: VercelRequest, res: VercelResponse) {
  try {
    const { uniqueId, name, email, phone, amount, purpose, confirmed } = req.body;

    if (!name || !email || !amount || !purpose) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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

    await sheets.spreadsheets.values.append({
      spreadsheetId: DONATION_SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    // ✅ Notify admin
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
    console.error("❌ Failed to record donation:", err);
    return res.status(500).json({ message: "Failed to record donation" });
  }
}

//
// ✅ PUT → Confirm a donation and send donor confirmation email
//
async function handleConfirmDonation(req: VercelRequest, res: VercelResponse) {
  try {
    const { uniqueId } = req.body;
    if (!uniqueId) {
      return res.status(400).json({ message: "Missing uniqueId" });
    }

    // Fetch all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DONATION_SHEET_ID,
      range: SHEET_NAME,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(500).json({ message: "No donation data available" });
    }

    const headers = rows[0].map((h) => h.trim());
    const idIndex = headers.indexOf("UniqueId");
    const confirmedIndex = headers.indexOf("Confirmed");

    if (idIndex === -1 || confirmedIndex === -1) {
      return res.status(500).json({
        message: "Sheet missing required columns (UniqueId / Confirmed)",
      });
    }

    // Find the donation row
    const targetRowIndex = rows.findIndex(
      (row, idx) => idx !== 0 && row[idIndex] === uniqueId
    );

    if (targetRowIndex === -1) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Update Confirmed → true
    const updateRange = `${SHEET_NAME}!${String.fromCharCode(
      65 + confirmedIndex
    )}${targetRowIndex + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: DONATION_SHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["true"]] },
    });

    // Extract donor data
    const row = rows[targetRowIndex];
    const data = Object.fromEntries(
      headers.map((h, i) => [h, row[i]?.toString().trim() || ""])
    );

    if (!data.Email) {
      return res.status(400).json({ message: "Missing donor email" });
    }

    // Send confirmation email to donor
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
    console.error("❌ Failed to confirm donation:", err);
    return res.status(500).json({ message: "Failed to confirm donation" });
  }
}
