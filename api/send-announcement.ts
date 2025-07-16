// api/send-announcement.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transporter } from "./lib/mailer.js"; 
import { AnnouncementSchema } from "../shared/schema.js"; 
import { getCommunityEmails } from "./lib/communityemails.js"; 

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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

    res.json({ success: true, message: "Announcement sent successfully" });
  } catch (error) {
    console.error("Announcement send error:", error);
    res.status(500).json({ message: "Failed to send announcement" });
  }
}
