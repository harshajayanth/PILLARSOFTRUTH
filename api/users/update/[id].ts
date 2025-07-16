import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../../../server/utils/googleDrive.js";

const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query; // ✅ Vercel-style param
    const { username, email, role, phone, age, source, bio, access } = req.body;

    if (!GOOGLE_USERS) {
      return res.status(500).json({ error: "Missing GOOGLE_USERS_SHEET_ID" });
    }

    // ✅ Fetch all rows to locate user row
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A1:I`, // Covers 9 columns
    });

    const rows = result.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    const headers = rows[0];
    const idIndex = headers.indexOf("id");

    if (idIndex === -1) {
      return res.status(500).json({ error: "No 'id' column found" });
    }

    // ✅ Find the correct row by matching id
    const rowIndex = rows.findIndex((r) => r[idIndex] === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Prepare updated row (MUST match column order in Sheet1)
    const updatedRow = [
      id,
      username,
      email,
      role,
      phone,
      age,
      source,
      bio,
      access,
    ];

    // ✅ Update the exact row in Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [updatedRow] },
    });

    return res.json({ message: `✅ User with id ${id} updated successfully` });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
}
