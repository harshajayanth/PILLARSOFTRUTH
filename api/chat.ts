import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chatMessageSchema } from "../shared/schema.js";
import { verifyToken } from "./lib/jwt.js";
import { getCommunityEmails } from "./lib/communityemails.js";
import { transporter } from "./lib/mailer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Extract sender from JWT if available
    let senderUser = null;
    const token = req.cookies?.auth_token;
    if (token) {
      try {
        senderUser = verifyToken(token); // { email, name, role }
      } catch {
        console.warn("Invalid JWT, fallback to optional senderEmail");
      }
    }

    // ✅ Validate incoming request
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid message data",
        errors: validation.error.errors,
      });
    }

    const { message, route, senderEmail: providedEmail } = validation.data;
    const senderEmail = senderUser?.email || providedEmail;
    const senderName = senderUser?.name || "Anonymous";

    if (!senderEmail) {
      return res.status(400).json({
        message: "Missing sender email (either JWT or senderEmail required)",
      });
    }

    // ✅ Fetch all community emails (admins + members) once
    const { adminEmails, memberEmails } = await getCommunityEmails();

    if (!adminEmails.length) {
      return res.status(404).json({ message: "No admin recipients found" });
    }

    let toRecipients: string[];
    let ccRecipients: string[] = [];

    if (route === "admin") {
      // Send only to admins
      toRecipients = adminEmails;
    } else {
      // Send to all members + CC admins
      if (!memberEmails.length) {
        return res.status(404).json({ message: "No member recipients found" });
      }
      toRecipients = memberEmails;
      ccRecipients = adminEmails; 
    }

    // ✅ Build email
    const mailOptions = {
      from: senderEmail,
      to: toRecipients.join(","),
      cc: ccRecipients.length ? ccRecipients.join(",") : undefined,
      subject: `Community Chat from ${senderName}`,
      html: `
        <h2>New Chat Message</h2>
        <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message}
        </div>
        <p><em>Sent via community chat widget</em></p>
      `,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message:
        route === "admin"
          ? "Message sent to admins successfully"
          : "Message sent to members (admins CC’d)",
    });
  } catch (error) {
    console.error("Chat message error:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
}
