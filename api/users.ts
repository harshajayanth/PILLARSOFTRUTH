import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js"; 

const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!GOOGLE_USERS) {
      return res.status(500).json({ error: "Missing GOOGLE_USERS_SHEET_ID" });
    }

    // ✅ Fetch sheet values
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A1:I`, // adjust columns as needed
    });

    const rows = result.data.values || [];
    if (rows.length === 0) return res.json([]);

    // ✅ First row is headers
    const headers = rows[0];
    const users = rows.slice(1).map((row) =>
      Object.fromEntries(
        headers.map((key, i) => [key.trim(), row[i] || ""])
      )
    );

    return res.status(200).json(users);
  } catch (error) {
    console.error("Google Sheets fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}
