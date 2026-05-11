import {
  sheets,
} from "../utils/googleDrive.js";

const GOOGLE_USERS =
  process.env
    .GOOGLE_USERS_SHEET_ID!;

// =====================================
// GET COMMUNITY EMAILS
// =====================================
export async function getCommunityEmails() {
  const result =
    await sheets.spreadsheets.values.get(
      {
        spreadsheetId:
          GOOGLE_USERS,

        range:
          `Sheet1!A1:L`,
      }
    );

  const rows =
    result.data.values ||
    [];

  if (
    rows.length === 0
  ) {
    return {
      adminEmails:
        [],

      memberEmails:
        [],

      youthLeaderEmails:
        [],

      organisationEmails:
        [],

      communicationEmails:
        [],
    };
  }

  const headers =
    rows[0];

  const emailIndex =
    headers.indexOf(
      "email"
    );

  const roleIndex =
    headers.indexOf(
      "role"
    );

  const accessIndex =
    headers.indexOf(
      "access"
    );

  const youthLeaderIndex =
    headers.indexOf(
      "youth_leader"
    );

  const positionIndex =
    headers.indexOf(
      "position"
    );

  const adminEmails: string[] =
    [];

  const memberEmails: string[] =
    [];

  const youthLeaderEmails: string[] =
    [];

  const organisationEmails: string[] =
    [];

  const communicationEmails: string[] =
    [];

  // =====================================
  // PROCESS USERS
  // =====================================
  rows
    .slice(1)
    .forEach(
      (row) => {
        const email =
          row[
            emailIndex
          ]
            ?.toLowerCase()
            ?.trim();

        const role =
          row[
            roleIndex
          ]
            ?.toLowerCase()
            ?.trim();

        const access =
          row[
            accessIndex
          ]
            ?.toLowerCase()
            ?.trim();

        const youthLeader =
          row[
            youthLeaderIndex
          ]
            ?.toLowerCase()
            ?.trim();

        const position =
          row[
            positionIndex
          ]
            ?.toLowerCase()
            ?.trim();

        // SKIP INVALID
        if (
          !email
        )
          return;

        // ONLY ACTIVE USERS
        if (
          access !==
          "active"
        )
          return;

        // =====================================
        // ADMINS
        // =====================================
        if (
          role ===
          "admin"
        ) {
          adminEmails.push(
            email
          );
        }

        // =====================================
        // MEMBERS
        // =====================================
        memberEmails.push(
          email
        );

        // =====================================
        // YOUTH LEADERS
        // =====================================
        if (
          youthLeader ===
          "true"
        ) {
          youthLeaderEmails.push(
            email
          );
        }

        // =====================================
        // ORGANISATION
        // =====================================
        if (
          position?.includes(
            "organisation"
          )
        ) {
          organisationEmails.push(
            email
          );
        }

        // =====================================
        // COMMUNICATION
        // =====================================
        if (
          position?.includes(
            "communication"
          )
        ) {
          communicationEmails.push(
            email
          );
        }
      }
    );

  // =====================================
  // REMOVE DUPLICATES
  // =====================================
  return {
    adminEmails:
      Array.from(
        new Set(
          adminEmails
        )
      ),

    memberEmails:
      Array.from(
        new Set(
          memberEmails
        )
      ),

    youthLeaderEmails:
      Array.from(
        new Set(
          youthLeaderEmails
        )
      ),

    organisationEmails:
      Array.from(
        new Set(
          organisationEmails
        )
      ),

    communicationEmails:
      Array.from(
        new Set(
          communicationEmails
        )
      ),
  };
}