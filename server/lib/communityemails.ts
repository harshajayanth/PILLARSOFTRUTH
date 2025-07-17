import { sheets } from "../utils/googleDrive.js"; 
const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID!;

export async function getCommunityEmails() {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_USERS,
    range: `Sheet1!A1:I`,
  });

  const rows = result.data.values || [];
  const headers = rows[0];
  const emailIndex = headers.indexOf("email");
  const roleIndex = headers.indexOf("role");

  const adminEmails: string[] = [];
  const memberEmails: string[] = [];

  rows.slice(1).forEach((row) => {
    const email = row[emailIndex]?.toLowerCase();
    const role = row[roleIndex]?.toLowerCase();
    if (!email) return;

    if (role === "admin") adminEmails.push(email);
    else memberEmails.push(email);
  });

  return { adminEmails, memberEmails };
}
