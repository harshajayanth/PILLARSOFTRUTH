import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drive } from "../server/utils/googleDrive.js"; // ✅ use exported authenticated drive
import { verifyToken } from "../server/lib/jwt.js";

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ✅ 1. Check auth token
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ 2. Fetch files from Google Drive
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields:
        "files(id, name, mimeType, webViewLink, webContentLink, createdTime, description)",
      orderBy: "createdTime desc",
    });

    const files = response.data.files || [];

    // ✅ 3. Transform files into session-friendly content
    const content = files.map((file) => {
      const isAudio =
        file.mimeType?.includes("audio") ||
        file.name?.match(/\.(mp3|wav|m4a)$/i);

      const type = isAudio ? "recording" : "chapter";

      return {
        id: file.id!,
        title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
        type: type as "recording" | "chapter",
        description: file.description || "No description available",
        fileUrl: file.webViewLink || file.webContentLink || "",
        duration: isAudio ? "25:30" : undefined,
        pages: !isAudio ? "12 pages" : undefined,
        createdAt: file.createdTime || new Date().toISOString(),
      };
    });

    // ✅ 4. Return content
    return res.status(200).json(content);
  } catch (error) {
    console.error("Content fetch error:", error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
}
