import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "csv-parse/sync";



const GOOGLE_ANNOUNCEMENT_SHEET = process.env.GOOGLE_ANNOUNCEMENT_SHEET || "";

// ✅ Helper to extract Google Drive file ID
function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const csvUrl = GOOGLE_ANNOUNCEMENT_SHEET;
    if (!csvUrl) {
      return res.status(500).json({ message: "Announcements sheet not configured" });
    }

    // ✅ Fetch published Google Sheet CSV
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();

    // ✅ Parse CSV into records
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    // ✅ Map records into structured announcements
    const announcements = records.map((row: any) => {
      const fileId = extractDriveFileId(row.Invitation);

      return {
        id: `${row.Title}-${row.Organiser}`,
        title: row.Title || "Untitled",
        date: row.Date || "TBD",
        fromtime: row.From || "",
        totime: row.To || "",
        venue: row.Venue || "TBD",
        organiser: row.Organiser || "TBD",
        event: row.Event || "TBD",
        file: fileId
          ? `https://drive.google.com/file/d/${fileId}/preview`
          : "",
      };
    });

    return res.json(announcements);
  } catch (error) {
    console.error("Error loading announcements:", error);
    return res.status(500).json({ message: "Failed to fetch announcements" });
  }
}
