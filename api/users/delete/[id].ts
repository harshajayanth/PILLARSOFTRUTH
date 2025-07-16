import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../../../server/utils/googleDrive.js"; // ✅ pre-authenticated sheets

const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query; // ✅ get from URL

    if (!GOOGLE_USERS) {
      return res.status(500).json({ error: "Missing GOOGLE_USERS_SHEET_ID" });
    }

    // ✅ Fetch all rows
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A1:I`, // includes header + data
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

    // ✅ Find matching row by ID
    const rowIndex = rows.findIndex((r) => r[idIndex] === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Delete row → Google Sheets `batchUpdate` (rowIndex is 0-based)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_USERS,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // default sheet (change if needed)
                dimension: "ROWS",
                startIndex: rowIndex, // header=0, so this matches correct row
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return res.json({ message: `✅ User with id ${id} deleted successfully` });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}
