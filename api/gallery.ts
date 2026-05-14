import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drive } from "../server/utils/googleDrive.js"; // ✅ Use shared Drive instance
import { methodNotAllowed, respondError } from "../server/lib/auth.js";

const GOOGLE_GALLERY_FOLDER_ID = process.env.GOOGLE_GALLERY_FOLDER_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    if (!GOOGLE_GALLERY_FOLDER_ID) {
      return respondError(res, "Gallery folder ID not configured", 500);
    }

    // ✅ Fetch only image files inside the gallery folder
    const response = await drive.files.list({
      q: `'${GOOGLE_GALLERY_FOLDER_ID}' in parents and trashed=false and mimeType contains 'image/'`,
      fields:
        "files(id, name, webViewLink, webContentLink, createdTime, description, mimeType)",
      orderBy: "createdTime desc",
    });

    const files = response.data.files || [];

    // ✅ Map to a frontend-friendly structure
    const galleryItems = files.map((file:any) => ({
      id: file.id!,
      title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
      description: file.description || "Community moment",
      // ✅ Use Google Drive thumbnail endpoint
      imageUrl: `https://drive.google.com/thumbnail?id=${file.id}`,
      createdAt: file.createdTime || new Date().toISOString(),
    }));

    return res.status(200).json(galleryItems);
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return respondError(res, "Failed to fetch gallery images", 500);
  }
}
