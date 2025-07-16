import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drive } from "../server/utils/googleDrive.js"; // ✅ Use shared Drive instance

const GOOGLE_GALLERY_FOLDER_ID = process.env.GOOGLE_GALLERY_FOLDER_ID || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!GOOGLE_GALLERY_FOLDER_ID) {
      return res
        .status(500)
        .json({ message: "Gallery folder ID not configured" });
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
    res.status(500).json({ message: "Failed to fetch gallery images" });
  }
}
