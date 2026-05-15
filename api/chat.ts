import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import { chatMessageSchema } from "../shared/schema.js";

import {
  getUserFromToken,
  respondSuccess,
  respondError,
  escapeHtml,
  methodNotAllowed,
} from "../server/lib/auth.js";

import {
  getCommunityEmails,
} from "../server/lib/communityemails.js";

import {
  transporter,
  ADMIN_EMAIL,
} from "../server/lib/mailer.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // =====================================
  // METHOD CHECK
  // =====================================
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    // =====================================
    // GET LOGGED IN USER
    // =====================================
    const senderUser =
      getUserFromToken(req);

    // =====================================
    // VALIDATE REQUEST
    // =====================================
    const validation =
      chatMessageSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return respondError(
        res,
        "Invalid message data",
        400
      );
    }

    const {
      message,
      route,
      subject,
      senderEmail:
        providedEmail,
    } = validation.data;

    // =====================================
    // FINAL SENDER INFO
    // =====================================
    const senderEmail =
      senderUser?.email ||
      providedEmail;

    const senderName =
      senderUser?.name ||
      "Anonymous";

    if (!senderEmail) {
      return respondError(
        res,
        "Sender email required",
        400
      );
    }

    // =====================================
    // FETCH COMMUNITY EMAILS
    // =====================================
    const {
      adminEmails,
      memberEmails,
      youthLeaderEmails,
      organisationEmails,
      communicationEmails,
    } =
      await getCommunityEmails();

    // =====================================
    // ROUTE RECIPIENTS
    // =====================================
    let recipients: string[] = [];

    if (route === "admin") {
      recipients = adminEmails;
    }

    else if (
      route === "members"
    ) {
      recipients =
        memberEmails;
    }

    else if (
      route ===
      "youth_leaders"
    ) {
      recipients =
        youthLeaderEmails;
    }

    else if (
      route ===
      "organisation"
    ) {
      recipients =
        organisationEmails;
    }

    else if (
      route ===
      "communication"
    ) {
      recipients =
        communicationEmails;
    }

    // =====================================
    // REMOVE EMPTY EMAILS
    // =====================================
    recipients =
      recipients.filter(Boolean);

    // =====================================
    // REMOVE DUPLICATES
    // =====================================
    recipients =
      Array.from(
        new Set(recipients)
      );

    // =====================================
    // VALIDATE RECIPIENTS
    // =====================================
    if (recipients.length === 0) {
      return respondError(
        res,
        "No recipients found",
        404
      );
    }

    // =====================================
    // SEND EMAIL
    // =====================================
    const mailOptions = {
      // SMTP SAFE
      from: `"${escapeHtml(senderName)}" <${escapeHtml(ADMIN_EMAIL)}>`,
      
      // REAL REPLY TARGET
      replyTo: senderEmail,

      // RECIPIENTS
      to: recipients.join(","),

      // COPY ADMINS
      cc: adminEmails.join(","),

      // DYNAMIC SUBJECT
      subject: escapeHtml(subject),

      // GMAIL STYLE BODY
      html: `
        <div style="font-family: Arial, sans-serif; color: #202124; line-height: 1.6;">

          <p>
            ${escapeHtml(message)}
          </p>

          <br />

          <p>
            <strong>
              From:
            </strong>
            ${escapeHtml(senderEmail)}
          </p>

        </div>
      `,
    };

    // =====================================
    // SEND MAIL
    // =====================================
    await transporter.sendMail(
      mailOptions
    );

    return respondSuccess(res, {
      message:
        "Message sent successfully",
    });

  } catch (error) {
    console.error(
      "Chat message error:",
      error
    );

    return respondError(
      res,
      "Failed to send message",
      500
    );
  }
}