import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drive } from "../server/utils/googleDrive.js";
import { withAuth, methodNotAllowed, respondError } from "../server/lib/auth.js";
import type { AuthUser } from "../server/lib/jwt.js";

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

async function handler(req: VercelRequest, res: VercelResponse, user: AuthUser) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: "files(id,name,mimeType,webViewLink,createdTime,description)",
      orderBy: "createdTime desc",
      pageSize: 100,
    });

    const files = response.data.files || [];
    const groupedSessions: Record<string, any> = {};

    files.forEach((file) => {
      const sessionName = file.description || "Uncategorized";
      const isAudio =
        file.mimeType?.startsWith("audio/") ||
        /\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name || "");
      const item = {
        id: file.id,
        title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
        type: isAudio ? "recording" : "chapter",
        fileUrl: `https://drive.google.com/file/d/${file.id}/preview`,
        createdAt: file.createdTime,
      };

      if (!groupedSessions[sessionName]) {
        groupedSessions[sessionName] = {
          title: sessionName,
          chapters: 0,
          recordings: 0,
          items: [],
        };
      }

      groupedSessions[sessionName].items.push(item);
      if (isAudio) {
        groupedSessions[sessionName].recordings++;
      } else {
        groupedSessions[sessionName].chapters++;
      }
    });

    return res.status(200).json(Object.values(groupedSessions));
  } catch (error) {
    console.error("Content fetch error:", error);
    return respondError(res, "Failed to fetch content", 500);
  }
}

export default withAuth(handler);