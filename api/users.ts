import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import { sheets } from "../server/utils/googleDrive.js";

const GOOGLE_USERS =
  process.env.GOOGLE_USERS_SHEET_ID || "";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!GOOGLE_USERS) {
    return res.status(500).json({
      error: "Missing GOOGLE_USERS_SHEET_ID",
    });
  }

  try {
    // =========================================
    // FETCH SHEET
    // =========================================
    const result =
      await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A1:L`,
      });

    const rows = result.data.values || [];

    if (rows.length === 0) {
      return res.status(404).json({
        error: "No data found",
      });
    }

    // =========================================
    // HEADERS
    // =========================================
    const headers = rows[0].map((h) =>
      h?.toString().trim()
    );

    const idIndex =
      headers.indexOf("id");

    if (idIndex === -1) {
      return res.status(500).json({
        error: "No 'id' column found",
      });
    }

    // =========================================
    // METHODS
    // =========================================
    switch (req.method) {
      // =====================================
      // GET USERS
      // =====================================
      case "GET": {
        const { active } = req.query;

        let users = rows
          .slice(1)
          .map((row) =>
            Object.fromEntries(
              headers.map((key, i) => [
                key,
                row[i] || "",
              ])
            )
          );

        // FILTER ACTIVE USERS
        if (active === "true") {
          users = users.filter(
            (user: any) =>
              user.access
                ?.toString()
                .trim()
                .toLowerCase() ===
              "active"
          );
        }

        return res.status(200).json(users);
      }

      // =====================================
      // UPDATE USER
      // =====================================
      case "PUT": {
        const { id } = req.query;

        if (
          !id ||
          typeof id !== "string"
        ) {
          return res.status(400).json({
            error: "Missing user id",
          });
        }

        // FIND USER ROW
        const rowIndex =
          rows.findIndex(
            (r) => r[idIndex] === id
          );

        console.log(
          "FOUND ROW INDEX:",
          rowIndex
        );

        if (rowIndex === -1) {
          return res.status(404).json({
            error: "User not found",
          });
        }

        // EXISTING USER
        const existingRow =
          rows[rowIndex];

        const existingUser =
          Object.fromEntries(
            headers.map((key, i) => [
              key,
              existingRow[i] || "",
            ])
          );

        const body = req.body;

        console.log(
          "REQUEST BODY:",
          body
        );

        // FINAL UPDATED ROW
        const updatedRow = [
          existingUser.id,

          body.username ??
            existingUser.username,

          existingUser.email,

          existingUser.role,

          body.phone ??
            existingUser.phone,

          body.location ??
            existingUser.location,

          body.age ??
            existingUser.age,

          existingUser.source,

          body.bio ??
            existingUser.bio,

          existingUser.access,

          body.position ??
            existingUser.position,

          existingUser.youth_leader,
        ];

        console.log(
          "UPDATED ROW:",
          updatedRow
        );

        // UPDATE GOOGLE SHEET
        await sheets.spreadsheets.values.update(
          {
            spreadsheetId:
              GOOGLE_USERS,

            // IMPORTANT
            range: `Sheet1!A${
              rowIndex + 1
            }:L${rowIndex + 1}`,

            valueInputOption:
              "RAW",

            requestBody: {
              values: [updatedRow],
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Profile updated successfully",
        });
      }

      // =====================================
      // DELETE USER
      // =====================================
      case "DELETE": {
        const { id } = req.query;

        if (
          !id ||
          typeof id !== "string"
        ) {
          return res.status(400).json({
            error: "Missing user id",
          });
        }

        const rowIndex =
          rows.findIndex(
            (r) => r[idIndex] === id
          );

        if (rowIndex === -1) {
          return res.status(404).json({
            error: "User not found",
          });
        }

        await sheets.spreadsheets.batchUpdate(
          {
            spreadsheetId:
              GOOGLE_USERS,

            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: 0,
                      dimension: "ROWS",

                      startIndex:
                        rowIndex,

                      endIndex:
                        rowIndex + 1,
                    },
                  },
                },
              ],
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "User deleted successfully",
        });
      }

      // =====================================
      // INVALID METHOD
      // =====================================
      default:
        return res.status(405).json({
          error: "Method not allowed",
        });
    }
  } catch (error) {
    console.error(
      "Users API error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}