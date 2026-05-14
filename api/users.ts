import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sheets } from "../server/utils/googleDrive.js";
import { withAdmin, methodNotAllowed, respondSuccess, respondError } from "../server/lib/auth.js";
import type { AuthUser } from "../server/lib/jwt.js";

const GOOGLE_USERS =
  process.env.GOOGLE_USERS_SHEET_ID || "";

async function handler(req: VercelRequest, res: VercelResponse, user: AuthUser) {
  if (!GOOGLE_USERS) {
    return respondError(res, "Missing GOOGLE_USERS_SHEET_ID", 500);
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
      return respondError(res, "No data found", 404);
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
      return respondError(res, "No 'id' column found", 500);
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

        users = users.map((user: Record<string, any>) => {
          const sanitizedUser = { ...user };
          delete sanitizedUser.password;
          delete sanitizedUser.secret;
          delete sanitizedUser.token;
          return sanitizedUser;
        });

        // FILTER ACTIVE USERS
        if (active === "active") {
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
          return respondError(res, "Missing user id", 400);
        }

        // FIND USER ROW
        const rowIndex =
          rows.findIndex(
            (r) => r[idIndex] === id
          );

        // console.log(
        //   "FOUND ROW INDEX:",
        //   rowIndex
        // );

        if (rowIndex === -1) {
          return respondError(res, "User not found", 404);
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

        // console.log(
        //   "REQUEST BODY:",
        //   body
        // );

        // FINAL UPDATED ROW
        const updatedRow = [
            existingUser.id,

            body.username ??
              existingUser.username,

            existingUser.email,

            body.role ??
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

            body.access ??
              existingUser.access,

            body.position ??
              existingUser.position,

            body.youth_leader !==
            undefined
              ? String(
                  body.youth_leader
                )
              : existingUser.youth_leader,
          ];

        // console.log(
        //   "UPDATED ROW:",
        //   updatedRow
        // );

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

        return res.status(200).json({ message: "Profile updated successfully" });
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
          return respondError(res, "Missing user id", 400);
        }

        const rowIndex =
          rows.findIndex(
            (r) => r[idIndex] === id
          );

        if (rowIndex === -1) {
          return respondError(res, "User not found", 404);
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

        return res.status(200).json({ message: "User deleted successfully" });
      }

      // =====================================
      // INVALID METHOD
      // =====================================
      default:
        return methodNotAllowed(res, ["GET", "PUT", "DELETE"]);
    }
  } catch (error) {
    console.error(
      "Users API error:",
      error
    );

    return respondError(res, "Internal server error", 500);
  }
}

export default withAdmin(handler);