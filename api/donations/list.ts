import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../../server/utils/googleDrive.js";

const DONATION_SHEET_ID = process.env.GOOGLE_DONATIONS_SHEET_ID|| "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Fetch all donation records
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DONATION_SHEET_ID,
      range: "Sheet1",
    });

    const rows = response.data.values;

    // ✅ If no data or only headers
    if (!rows || rows.length < 2) {
      return res.json([]);
    }

    const headers = rows[0]; // First row = column headers

    // ✅ Convert each row to an object
    const donations = rows.slice(1).map((row) => {
      const entry: Record<string, string> = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] || "";
      });
      return entry;
    });

    return res.status(200).json(donations);
  } catch (err) {
    console.error("❌ Failed to fetch donation list:", err);
    return res.status(500).json({ message: "Failed to fetch donations" });
  }
}
