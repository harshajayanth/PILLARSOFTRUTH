import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  chatMessageSchema,
} from "../shared/schema.js";

import {
  verifyToken,
} from "../server/lib/jwt.js";

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
  if (
    req.method !==
    "POST"
  ) {
    return res
      .status(405)
      .json({
        message:
          "Method Not Allowed",
      });
  }

  try {
    // =====================================
    // GET LOGGED IN USER
    // =====================================
    let senderUser =
      null;

    const token =
      req.cookies
        ?.auth_token;

    if (token) {
      try {
        senderUser =
          verifyToken(
            token
          );
      } catch {
        console.warn(
          "Invalid JWT, using senderEmail fallback"
        );
      }
    }

    // =====================================
    // VALIDATE REQUEST
    // =====================================
    const validation =
      chatMessageSchema.safeParse(
        req.body
      );

    if (
      !validation.success
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid message data",

          errors:
            validation
              .error
              .errors,
        });
    }

    const {
      message,
      route,
      senderEmail:
        providedEmail,
    } =
      validation.data;

    // =====================================
    // FINAL SENDER INFO
    // =====================================
    const senderEmail =
      senderUser
        ?.email ||
      providedEmail;

    const senderName =
      senderUser
        ?.name ||
      "Anonymous";

    if (
      !senderEmail
    ) {
      return res
        .status(400)
        .json({
          message:
            "Sender email required",
        });
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
    let recipients: string[] =
      [];

    if (
      route ===
      "admin"
    ) {
      recipients =
        adminEmails;
    }

    else if (
      route ===
      "members"
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
      recipients.filter(
        Boolean
      );

    // =====================================
    // REMOVE DUPLICATES
    // =====================================
    recipients =
      Array.from(
        new Set(
          recipients
        )
      );

    // =====================================
    // VALIDATE RECIPIENTS
    // =====================================
    if (
      recipients.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          message:
            "No recipients found",
        });
    }

    // =====================================
    // SEND EMAIL
    // =====================================
    const mailOptions =
      {
        // SMTP SAFE
        from: `"${senderName}" <${ADMIN_EMAIL}>`,

        // REAL REPLY TARGET
        replyTo:
          senderEmail,

        // RECIPIENTS BASED ON ROUTE
        to: recipients.join(
          ","
        ),

        // ALWAYS SEND COPY TO ADMINS
        cc: adminEmails.join(
          ","
        ),

        subject: `Community Chat - ${route}`,

        html: `
          <h2>
            New Community Chat Message
          </h2>

          <p>
            <strong>
              From:
            </strong>
            ${senderName}
            (${senderEmail})
          </p>

          <p>
            <strong>
              Route:
            </strong>
            ${route}
          </p>

          <p>
            <strong>
              Message:
            </strong>
          </p>

          <div
            style="
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 10px 0;
            "
          >
            ${message}
          </div>

          <p>
            <em>
              Replying to this email
              will directly reply to:
              ${senderEmail}
            </em>
          </p>
        `,
      };

    // =====================================
    // SEND MAIL
    // =====================================
    await transporter.sendMail(
      mailOptions
    );

    return res.json({
      success: true,

      message:
        "Message sent successfully",
    });
  } catch (error) {
    console.error(
      "Chat message error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to send message",
      });
  }
}