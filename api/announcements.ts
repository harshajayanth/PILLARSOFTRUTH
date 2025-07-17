import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "csv-parse/sync";
import { transporter } from "../server/lib/mailer.js";
import { AnnouncementSchema } from "../shared/schema.js";
import { getCommunityEmails } from "../server/lib/communityemails.js";

const GOOGLE_ANNOUNCEMENT_SHEET = process.env.GOOGLE_ANNOUNCEMENT_SHEET || "";
const CREATE_ANNOUNCEMENT_FORM_URL = process.env.GOOGLE_FORM_URL || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// ✅ Helper to extract Google Drive file ID
function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      /**
       * ✅ 1. GET → Fetch announcements from Google Sheet CSV
       */
      case "GET": {
        if (!GOOGLE_ANNOUNCEMENT_SHEET) {
          return res
            .status(500)
            .json({ message: "Announcements sheet not configured" });
        }

        const response = await fetch(GOOGLE_ANNOUNCEMENT_SHEET);
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet: ${response.statusText}`);
        }

        const csvText = await response.text();

        const records = parse(csvText, {
          columns: true,
          skip_empty_lines: true,
        });

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

        return res.status(200).json(announcements);
      }

      /**
       * ✅ 2. POST → Send an announcement email
       */
      case "POST": {
        // ✅ Validate incoming announcement
        const validation = AnnouncementSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid announcement data",
            errors: validation.error.errors,
          });
        }

        const a = validation.data;

        // ✅ Fetch community emails from Google Sheets
        const { adminEmails, memberEmails } = await getCommunityEmails();

        const mailOptions = {
          from: ADMIN_EMAIL,
          to: adminEmails,
          cc: memberEmails,
          subject: `New Announcement: ${a.title}`,
          html: `
            <h2>${a.title}</h2>
            <p><strong>Event:</strong> ${a.event}</p>
            <p><strong>Date:</strong> ${a.date}</p>
            <p><strong>Time:</strong> ${a.fromtime} - ${a.totime}</p>
            <p><strong>Venue:</strong> ${a.venue}</p>
            <p><strong>Organiser:</strong> ${a.organiser}</p>
            ${
              a.file
                ? `<p><a href="${a.file}" target="_blank">View Attachment</a></p>`
                : ""
            }
            <p><em>This announcement was sent via Pillars of Truth community portal.</em></p>
          `,
        };

        // ✅ Send email
        await transporter.sendMail(mailOptions);

        return res.json({
          success: true,
          message: "Announcement sent successfully",
        });
      }

      /**
       * ✅ 3. PUT → Redirect to Google Form (create announcement)
       */
      case "PUT": {
        if (!CREATE_ANNOUNCEMENT_FORM_URL) {
          return res
            .status(500)
            .json({ message: "Announcement form URL not configured" });
        }

        return res.status(200).json({ url: CREATE_ANNOUNCEMENT_FORM_URL });
      }

      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Announcements API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
