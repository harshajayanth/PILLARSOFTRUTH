import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js"; // ✅ pre-authenticated sheets

const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!GOOGLE_USERS) {
    return res.status(500).json({ error: "Missing GOOGLE_USERS_SHEET_ID" });
  }

  try {
    // ✅ Always fetch sheet to get headers + rows
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A1:I`, // adjust columns if needed
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

    // ✅ Handle different methods
    switch (req.method) {
      case "GET": {
        // Return all users as JSON
        const users = rows.slice(1).map((row) =>
          Object.fromEntries(headers.map((key, i) => [key.trim(), row[i] || ""]))
        );
        return res.status(200).json(users);
      }

      case "PUT": {
        const { id } = req.query;
        const { username, email, role, phone, age, source, bio, access } =
          req.body;

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing user id" });
        }

        const rowIndex = rows.findIndex((r) => r[idIndex] === id);
        if (rowIndex === -1) {
          return res.status(404).json({ error: "User not found" });
        }

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

        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_USERS,
          range: `Sheet1!A${rowIndex + 1}:I${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [updatedRow] },
        });

        return res.json({ message: `✅ User with id ${id} updated successfully` });
      }

      case "DELETE": {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Missing user id" });
        }

        const rowIndex = rows.findIndex((r) => r[idIndex] === id);
        if (rowIndex === -1) {
          return res.status(404).json({ error: "User not found" });
        }

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_USERS,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // default sheet
                    dimension: "ROWS",
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                  },
                },
              },
            ],
          },
        });

        return res.json({ message: `✅ User with id ${id} deleted successfully` });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Users API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
