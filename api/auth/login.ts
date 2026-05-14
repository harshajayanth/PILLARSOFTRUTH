import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { methodNotAllowed, respondError } from "../../server/lib/auth.js";

// ✅ Environment variables
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://pillarsoftruthcoc.vercel.app/api/auth/callback"
    : "http://localhost:3000/api/auth/callback";

// ✅ Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    return res.status(200).json({ redirectUrl: authUrl });
  } catch (error) {
    console.error("Auth login error:", error);
    return respondError(res, "Internal Server Error", 500);
  }
}
