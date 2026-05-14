import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "csv-parse/sync";
import { transporter } from "../server/lib/mailer.js";
import { AnnouncementSchema } from "../shared/schema.js";
import { getCommunityEmails } from "../server/lib/communityemails.js";
import { methodNotAllowed, respondError, withAdmin, withAuth, escapeHtml } from "../server/lib/auth.js";

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
        return withAuth(async (authReq, authRes) => {
          if (!GOOGLE_ANNOUNCEMENT_SHEET) {
            return respondError(authRes, "Announcements sheet not configured", 500);
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

          return authRes.status(200).json(announcements);
        })(req, res);
      }

      /**
       * ✅ 2. POST → Send an announcement email
       */
      case "POST": {
        return withAdmin(async (adminReq, adminRes, user) => {
          const validation = AnnouncementSchema.safeParse(adminReq.body);
          if (!validation.success) {
            return respondError(adminRes, "Invalid announcement data", 400);
          }

          const a = validation.data;
          const { adminEmails, memberEmails } = await getCommunityEmails();

          const safeTitle = escapeHtml(a.title);
          const safeEvent = escapeHtml(a.event);
          const safeDate = escapeHtml(a.date);
          const safeFromTime = escapeHtml(a.fromtime);
          const safeToTime = escapeHtml(a.totime);
          const safeVenue = escapeHtml(a.venue);
          const safeOrganiser = escapeHtml(a.organiser);
          const safeFileLink = a.file ? escapeHtml(a.file) : "";

          const mailOptions = {
            from: ADMIN_EMAIL,
            to: adminEmails,
            cc: memberEmails,
            subject: `New Announcement: ${safeTitle}`,
            html: `
              <h2>${safeTitle}</h2>
              <p><strong>Event:</strong> ${safeEvent}</p>
              <p><strong>Date:</strong> ${safeDate}</p>
              <p><strong>Time:</strong> ${safeFromTime} - ${safeToTime}</p>
              <p><strong>Venue:</strong> ${safeVenue}</p>
              <p><strong>Organiser:</strong> ${safeOrganiser}</p>
              ${
                safeFileLink
                  ? `<p><a href="${safeFileLink}" target="_blank" rel="noopener noreferrer">View Attachment</a></p>`
                  : ""
              }
              <p><em>This announcement was sent via Pillars of Truth community portal.</em></p>
            `,
          };

          await transporter.sendMail(mailOptions);
          return adminRes.status(200).json({ message: "Announcement sent successfully" });
        })(req, res);
      }

      /**
       * ✅ 3. PUT → Redirect to Google Form (create announcement)
       */
      case "PUT": {
        return withAdmin(async (adminReq, adminRes, user) => {
          if (!CREATE_ANNOUNCEMENT_FORM_URL) {
            return respondError(adminRes, "Announcement form URL not configured", 500);
          }
          return adminRes.status(200).json({ url: CREATE_ANNOUNCEMENT_FORM_URL });
        })(req, res);
      }

      default:
        return methodNotAllowed(res, ["GET", "POST", "PUT"]);
    }
  } catch (error) {
    console.error("Announcements API error:", error);
    return respondError(res, "Internal server error", 500);
  }
}
