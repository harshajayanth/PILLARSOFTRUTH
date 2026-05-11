import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  sheets,
} from "../server/utils/googleDrive.js";

import {
  v4 as uuidv4,
} from "uuid";

import {
  transporter,
  ADMIN_EMAIL,
} from "../server/lib/mailer.js";

import {
  contactFormSchema,
} from "../shared/schema.js";

const GOOGLE_USERS =
  process.env
    .GOOGLE_USERS_SHEET_ID || "";

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
    // VALIDATE FORM
    // =====================================
    const validation =
      contactFormSchema.safeParse(
        req.body
      );

    if (
      !validation.success
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid form data",

          errors:
            validation
              .error
              .errors,
        });
    }

    const formData =
      validation.data;

    // =====================================
    // FETCH EXISTING USERS
    // =====================================
    const existingData =
      await sheets.spreadsheets.values.get(
        {
          spreadsheetId:
            GOOGLE_USERS,

          range:
            `Sheet1!A2:C`,
        }
      );

    const rows =
      existingData
        .data
        .values || [];

    const existingEmails =
      rows
        .map(
          (
            row: any
          ) => row[2]
        )
        .filter(
          (
            email:
              | string
              | undefined
          ) =>
            email &&
            email !==
              "email"
        )
        .map(
          (
            email: string
          ) =>
            email.toLowerCase()
        );

    const incomingEmail =
      formData.email.toLowerCase();

    // =====================================
    // DUPLICATE CHECK
    // =====================================
    if (
      existingEmails.includes(
        incomingEmail
      )
    ) {
      return res
        .status(409)
        .json({
          message:
            "Email already registered",
        });
    }

    // =====================================
    // CREATE USER ROW
    // =====================================
    const newId =
      uuidv4();

    const newUser = [
      // A
      newId,

      // B
      `${formData.firstName} ${formData.lastName}`,

      // C
      formData.email,

      // D
      "user",

      // E
      formData.phone ||
        "",

      // F
      formData.location ||
        "",

      // G
      formData.age ||
        "",

      // H
      formData.hearAbout ||
        "",

      // I
      formData.message ||
        "",

      // J
      "inactive",

      // K
      "",

      // L
      "false",
    ];

    // =====================================
    // APPEND TO SHEET
    // =====================================
    await sheets.spreadsheets.values.append(
      {
        spreadsheetId:
          GOOGLE_USERS,

        range:
          "Sheet1",

        valueInputOption:
          "USER_ENTERED",

        requestBody:
          {
            values: [
              newUser,
            ],
          },
      }
    );

    // =====================================
    // SEND ADMIN EMAIL
    // =====================================
    await transporter.sendMail(
      {
        from:
          ADMIN_EMAIL,

        to:
          ADMIN_EMAIL,

        subject:
          "New Community Member Application",

        html: `
          <h2>
            New Community Member Application
          </h2>

          <p>
            <strong>
              Name:
            </strong>
            ${formData.firstName}
            ${formData.lastName}
          </p>

          <p>
            <strong>
              Email:
            </strong>
            ${formData.email}
          </p>

          <p>
            <strong>
              Phone:
            </strong>
            ${
              formData.phone ||
              "Not provided"
            }
          </p>

          <p>
            <strong>
              Age:
            </strong>
            ${
              formData.age ||
              "Not provided"
            }
          </p>

          <p>
            <strong>
              Location:
            </strong>
            ${
              formData.location ||
              "Not provided"
            }
          </p>

          <p>
            <strong>
              Heard About Us:
            </strong>
            ${
              formData.hearAbout ||
              "Not specified"
            }
          </p>

          <p>
            <strong>
              Bio:
            </strong>
            ${
              formData.message ||
              "No message"
            }
          </p>
        `,
      }
    );

    // =====================================
    // SEND USER CONFIRMATION
    // =====================================
    await transporter.sendMail(
      {
        from:
          ADMIN_EMAIL,

        to:
          formData.email,

        subject:
          "Welcome to Pillars of Truth Community!",

        html: `
          <h2>
            Thank you for your interest!
          </h2>

          <p>
            Dear
            ${formData.firstName},
          </p>

          <p>
            Thank you for applying
            to join our Pillars of
            Truth youth community.
            We have received your
            application and will
            review it shortly.
          </p>

          <p>
            One of our team members
            will contact you within
            the next few days to
            discuss the next steps.
          </p>

          <p>
            May God bless you as
            you seek to grow in
            His word!
          </p>

          <p>
            In Christ,
            <br />
            Pillars of Truth Team
          </p>
        `,
      }
    );

    // =====================================
    // SUCCESS
    // =====================================
    return res.json({
      success: true,

      message:
        "Application submitted successfully",
    });
  } catch (error) {
    console.error(
      "Contact form error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to submit application",
      });
  }
}