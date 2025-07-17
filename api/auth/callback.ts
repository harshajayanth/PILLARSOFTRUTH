import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { signToken } from "../../server/lib/jwt.js";
import { sheets } from "../../server/utils/googleDrive.js"; // ✅ Reuse service account

// ✅ OAuth2 Client (for Google Login only)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://pillarsoftruthcoc.vercel.app/api/auth/callback"
    : "http://localhost:3000/api/auth/callback";

// ✅ Google Sheet ID for users
const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID || "";

// ✅ OAuth Client for login
const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: "Authorization code missing" });
    }

    // ✅ 1. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // ✅ 2. Get Google user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const userEmail = userInfo.email?.toLowerCase();

    if (!userEmail) {
      return res.redirect("/?auth=error&reason=missing_email");
    }

    // ✅ 3. Fetch Google Sheet users via service account
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_USERS,
      range: `Sheet1!A2:I`,
    });

    const rows = sheetData.data.values || [];
    const matchedUser = rows.find((row) => row[2]?.toLowerCase() === userEmail);

    if (!matchedUser) {
      console.warn(`❌ User not found: ${userEmail}`);
      return res.redirect("/?auth=denied");
    }

    const roleFromSheet = (matchedUser[3] || "user").toLowerCase();
    const access = (matchedUser[8] || "").toLowerCase();

    if (access !== "active") {
      console.warn(`⏳ Access not approved for: ${userEmail}`);
      return res.redirect("/?auth=pending");
    }

    const finalRole: "user" | "admin" =
      roleFromSheet === "admin" ? "admin" : "user";

    // ✅ 4. Prepare minimal user object
    const userPayload = {
      email: userInfo.email!,
      name: userInfo.name!,
      picture: userInfo.picture!,
      role: finalRole,
    };

    // ✅ 5. Sign JWT
    const token = signToken(userPayload);

    // ✅ 6. Set secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = [
      `Path=/`,
      `SameSite=Lax`, // ✅ Allows cookies after redirects
      `Max-Age=${60 * 60 * 24}`, // ✅ 1 day
      "HttpOnly", // ✅ Always HttpOnly
      isProd ? "Secure" : "", // ✅ Only Secure in production
    ]
      .filter(Boolean) // remove empty string
      .join("; ");

    res.setHeader("Set-Cookie", `auth_token=${token}; ${cookieOptions}`);

    // ✅ 7. Redirect back to app
    res.redirect("/?auth=success");
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect("/?auth=error");
  }
}
