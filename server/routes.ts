import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import {
  contactFormSchema,
  chatMessageSchema,
  SessionContent,
  GalleryItem,
  AuthUser,
  AnnouncementSchema,
} from "@shared/schema";
import nodemailer from "nodemailer";
import session from "express-session";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drive } from "server/utils/googleDrive";
import { auth } from "server/utils/googleDrive";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

import { google } from "googleapis";

// Env vars
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@pillarsoftruth.org";
const MEMBER_EMAIL = process.env.MEMBER_EMAIL || "members@pillarsoftruth.org";
const GMAIL_PASS_KEY = process.env.GMAIL_PASSKEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
const GOOGLE_GALLERY_FOLDER_ID = process.env.GOOGLE_GALLERY_FOLDER_ID || "";
const GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL || "";
const GOOGLE_SHEET = process.env.GOOGLE_ANNOUNCEMENT_SHEET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "supersecret";
const DONATION_SHEET_ID = process.env.GOOGLE_DONATIONS_SHEET_ID;
const GOOGLE_USERS = process.env.GOOGLE_USERS_SHEET_ID;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMBERS_FILE_PATH = path.join(__dirname, "data", "members_email.json");

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: ADMIN_EMAIL,
    pass: GMAIL_PASS_KEY,
  },
});

function extractDriveFileId(link: string): string | null {
  const match = link?.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  // --- AUTH ---
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json(user);
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    res.json({ redirectUrl: authUrl });
  });

  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      if (!code)
        return res.status(400).json({ message: "Authorization code missing" });

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      const sheets = google.sheets({ version: "v4", auth });

      const userEmail = userInfo.email?.toLowerCase();
      if (!userEmail) {
        return res.redirect("/?auth=error&reason=missing_email");
      }

      const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A2:I`,
      });

      const rows = sheetData.data.values || [];
      const matchedUser = rows.find(
        (row) => row[2]?.toLowerCase() === userEmail
      );

      if (!matchedUser) {
        console.warn(`❌ User not found: ${userEmail}`);
        return res.redirect("/?auth=denied");
      }

      const roleFromSheet = (matchedUser[3] || "user").toLowerCase();
      const access = (matchedUser[8] || "").toLowerCase();

      if (access !== "active") {
        console.warn(`⏳ Access not approved for: ${userEmail}`);
        return res.redirect("/?auth=pending");
      }

      const finalRole = roleFromSheet === "admin" ? "admin" : "user";

      const user: AuthUser = {
        email: userInfo.email!,
        name: userInfo.name!,
        picture: userInfo.picture!,
        isAuthenticated: true,
        role: finalRole,
      };

      (req.session as any).user = user;
      (req.session as any).access_token = tokens.access_token;

      res.cookie("sessionId", req.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect("/?auth=success");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.redirect("/?auth=error");
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // --- CONTENT ---
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;

      if (!user?.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const response = await drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
        fields:
          "files(id, name, mimeType, webViewLink, webContentLink, createdTime, description)",
        orderBy: "createdTime desc",
      });

      const files = response.data.files || [];

      const content: SessionContent[] = files.map((file) => {
        const isAudio =
          file.mimeType?.includes("audio") ||
          file.name?.match(/\.(mp3|wav|m4a)$/i);
        const type = isAudio ? "recording" : "chapter";

        return {
          id: file.id!,
          title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
          type: type as "recording" | "chapter",
          description: file.description || "No description available",
          fileUrl: file.webViewLink || file.webContentLink || "",
          duration: isAudio ? "25:30" : undefined,
          pages: !isAudio ? "12 pages" : undefined,
          createdAt: file.createdTime || new Date().toISOString(),
        };
      });

      res.json(content);
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // --- GALLERY ---

  app.get("/api/gallery", async (req: Request, res: Response) => {
    try {
      if (!GOOGLE_GALLERY_FOLDER_ID) {
        return res
          .status(500)
          .json({ message: "Gallery folder ID not configured" });
      }
      const response = await drive.files.list({
        q: `'${GOOGLE_GALLERY_FOLDER_ID}' in parents and trashed=false and mimeType contains 'image'`,
        fields:
          "files(id, name, webViewLink, webContentLink, createdTime, description)",
        orderBy: "createdTime desc",
      });

      const files = response.data.files || [];

      const galleryItems: GalleryItem[] = files.map((file) => ({
        id: file.id!,
        title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
        description: file.description || "Community moment",
        imageUrl: `https://drive.google.com/thumbnail?id=${file.id}`,
        createdAt: file.createdTime || new Date().toISOString(),
      }));

      res.json(galleryItems);
    } catch (error) {
      console.error("Gallery fetch error:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  //  Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const sheets = google.sheets({ version: "v4", auth });
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A1:I`, // adjust columns
      });

      const rows = result.data.values || [];
      if (rows.length === 0) return res.json([]);

      const headers = rows[0];
      const users = rows
        .slice(1)
        .map((row) =>
          Object.fromEntries(headers.map((key, i) => [key, row[i] || ""]))
        );

      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
  });

  //Update User
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, role, phone, age, source, bio, access } =
        req.body;

      const sheets = google.sheets({ version: "v4", auth });

      // ✅ Fetch all rows to find correct row
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A1:I`, // A→I covers 9 columns
      });

      const rows = result.data.values || [];
      const headers = rows[0];
      const idIndex = headers.indexOf("id");

      if (idIndex === -1) {
        return res.status(500).json({ error: "No 'id' column found" });
      }

      const rowIndex = rows.findIndex((r) => r[idIndex] === id);
      if (rowIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ Build updated row
      const updatedRow = [
        id,
        username,
        email,
        role,
        phone,
        age,
        source,
        bio,
        access,
      ];

      // ✅ Update the correct row
      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A${rowIndex + 1}:I${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [updatedRow] },
      });

      res.json({ message: `User with id ${id} updated successfully` });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: err });
    }
  });

  //Delete User
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const sheets = google.sheets({ version: "v4", auth });

      // ✅ Fetch all rows
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A1:I`,
      });

      const rows = result.data.values || [];
      const headers = rows[0];
      const idIndex = headers.indexOf("id");

      if (idIndex === -1) {
        return res.status(500).json({ error: "No 'id' column found" });
      }

      const rowIndex = rows.findIndex((r) => r[idIndex] === id);
      if (rowIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ Delete row (Google Sheets uses batchUpdate)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_USERS,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // first sheet (adjust if needed)
                  dimension: "ROWS",
                  startIndex: rowIndex, // 0-based index
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      res.json({ message: `User with id ${id} deleted successfully` });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: err });
    }
  });

  // --- CONTACT FORM ---
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      // ✅ Validate incoming form
      const validation = contactFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid form data",
          errors: validation.error.errors,
        });
      }
      const formData = validation.data;

      const sheets = google.sheets({ version: "v4", auth });

      // ✅ Fetch existing rows from Google Sheet
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_USERS,
        range: `Sheet1!A2:C`, // Assuming A has id, B username, C email
      });

      const rows = existingData.data.values || [];
      console.log(rows);
      const existingEmails = rows
        .map((row: any) => row[2]) // column C = email
        .filter((email: string | undefined) => email && email !== "email")
        .map((email: string) => email.toLowerCase());

      const incomingEmail = formData.email.toLowerCase();

      if (existingEmails.includes(incomingEmail)) {
        return res.status(409).json({
          message: "Email already registered",
        });
      }
      // ✅ Generate new user entry
      const newId = uuidv4();
      const newUser = [
        newId, // id
        `${formData.firstName} ${formData.lastName}`, // username
        formData.email,
        "user", // default role
        formData.phone || "",
        formData.ageGroup || "",
        formData.hearAbout || "",
        formData.message || "", // bio/message
        "inactive", // access
      ];

      // ✅ Append new user to Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_USERS,
        range: "Sheet1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [newUser],
        },
      });

      // ✅ Send admin notification email
      const mailOptions = {
        from: ADMIN_EMAIL,
        to: ADMIN_EMAIL,
        subject: "New Community Member Application",
        html: `
        <h2>New Community Member Application</h2>
        <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
        <p><strong>Age Group:</strong> ${formData.ageGroup}</p>
        <p><strong>Heard about us:</strong> ${
          formData.hearAbout || "Not specified"
        }</p>
        <p><strong>Message:</strong> ${formData.message}</p>
      `,
      };
      await transporter.sendMail(mailOptions);

      // ✅ Send confirmation email to user
      const confirmationOptions = {
        from: ADMIN_EMAIL,
        to: formData.email,
        subject: "Welcome to Pillars of Truth Community!",
        html: `
        <h2>Thank you for your interest!</h2>
        <p>Dear ${formData.firstName},</p>
        <p>Thank you for applying to join our Pillars of Truth youth community. We have received your application and will review it shortly.</p>
        <p>One of our team members will contact you within the next few days to discuss the next steps.</p>
        <p>May God bless you as you seek to grow in His word!</p>
        <p>In Christ,<br>Pillars of Truth Team</p>
      `,
      };
      await transporter.sendMail(confirmationOptions);

      res.json({
        success: true,
        message: "Application submitted successfully",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });


  // --- CHAT MESSAGE ---
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const validation = chatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid message data",
          errors: validation.error.errors,
        });
      }

      const { message, route } = validation.data;

      const mailOptions: any = {
        from: ADMIN_EMAIL,
        subject: `New Message from Community Chat - ${
          route === "admin" ? "Admin" : "Members"
        }`,
        html: `
          <h2>New Community Chat Message</h2>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message}
          </div>
          <p><em>This message was sent through the community website chat widget.</em></p>
        `,
      };

      if (route === "admin") {
        mailOptions.to = ADMIN_EMAIL;
      } else {
        mailOptions.to = ADMIN_EMAIL;
        mailOptions.cc = MEMBER_EMAIL;
      }

      await transporter.sendMail(mailOptions);

      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Chat message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  //Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const csvUrl = GOOGLE_SHEET;
      const response = await fetch(csvUrl!);
      const csvText = await response.text();

      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
      });

      // Optional: normalize/clean
      const announcements = records.map((row: any) => {
        const fileId = extractDriveFileId(row.Invitation);

        return {
          id: `${row.Title}-${row.Time}`,
          title: row.Title || "Untitled",
          date: row.Date,
          fromtime: row.From,
          totime: row.To,
          venue: row.Venue || "TBD",
          organiser: row.Organiser || "TBD",
          event: row.Event || "TBD",
          file: fileId
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : "",
        };
      });

      res.json(announcements);
    } catch (error) {
      console.error("Error loading announcements from sheet:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Redirect to the announcement form URL
  app.get("/api/create-announcement", (req, res) => {
    const redirectUrl = GOOGLE_FORM_URL;

    if (!redirectUrl) {
      return res.status(500).send("Redirect URL not configured");
    }

    res.redirect(redirectUrl);
  });

  app.post("/api/send-announcement", async (req: Request, res: Response) => {
    try {
      const validation = AnnouncementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid message data",
          errors: validation.error.errors,
        });
      }

      const a = validation.data;

      const mailOptions = {
        from: ADMIN_EMAIL,
        to: ADMIN_EMAIL,
        cc: MEMBER_EMAIL,
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

      await transporter.sendMail(mailOptions);

      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Chat message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  //Send Donation Confirmation Message
  app.post("/api/donations", async (req: Request, res: Response) => {
    try {
      const { uniqueId, name, email, phone, amount, purpose, confirmed } =
        req.body;

      if (!name || !email || !amount || !purpose) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const sheets = google.sheets({ version: "v4", auth });

      const timestamp = new Date().toLocaleString();

      const row = [
        uniqueId,
        name,
        email,
        phone || "",
        amount,
        purpose,
        timestamp,
        confirmed === true ? "true" : "false",
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: DONATION_SHEET_ID!,
        range: "Sheet1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [row],
        },
      });

      // ✅ Send notification email
      const mailOptions = {
        from: ADMIN_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Donation Received - ${name}`,
        html: `
        <h2>New Donation Recorded</h2>
        <p><strong>Donor Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Confirmed:</strong> ${confirmed === true ? "Yes" : "No"}</p>
        <p><strong>Unique ID:</strong> ${uniqueId}</p>
      `,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ success: true, message: "Donation recorded", id: uniqueId });
    } catch (err) {
      console.error("Failed to append to sheet:", err);
      res.status(500).json({ message: "Failed to record donation" });
    }
  });

  //Get all Donations
  app.get("/api/donations/list", async (req: Request, res: Response) => {
    try {
      const sheets = google.sheets({ version: "v4", auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: DONATION_SHEET_ID,
        range: "Sheet1",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        return res.json([]);
      }

      const headers = rows[0];
      const donations = rows.slice(1).map((row) => {
        const entry: any = {};
        headers.forEach((header, index) => {
          entry[header] = row[index] || "";
        });
        return entry;
      });

      res.json(donations);
    } catch (err) {
      console.error("Failed to fetch donation list:", err);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  //Update Donation Confirmation Status
  app.post("/api/donations/confirm", async (req: Request, res: Response) => {
    try {
      const { uniqueId } = req.body;
      if (!uniqueId) {
        return res.status(400).json({ message: "Missing uniqueId" });
      }

      const sheets = google.sheets({ version: "v4", auth });

      // Fetch all rows from the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: DONATION_SHEET_ID,
        range: "Sheet1",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        return res.status(500).json({ message: "No donation data available" });
      }

      const headers = rows[0].map((h) => h.trim());
      const idIndex = headers.indexOf("UniqueId");
      const confirmedIndex = headers.indexOf("Confirmed");

      if (idIndex === -1 || confirmedIndex === -1) {
        return res
          .status(500)
          .json({ message: "Sheet missing required columns" });
      }

      const targetRowIndex = rows.findIndex(
        (row, idx) => idx !== 0 && row[idIndex] === uniqueId
      );
      if (targetRowIndex === -1) {
        return res.status(404).json({ message: "Donation not found" });
      }

      // Update the 'Confirmed' column to 'true'
      const updateRange = `Sheet1!${String.fromCharCode(65 + confirmedIndex)}${
        targetRowIndex + 1
      }`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: DONATION_SHEET_ID,
        range: updateRange,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["true"]],
        },
      });

      // Construct the donor's data from the row
      const row = rows[targetRowIndex];
      const data = Object.fromEntries(
        headers.map((h, i) => [h, row[i]?.toString().trim() || ""])
      );

      // Safety check: ensure email is defined
      if (!data.Email) {
        return res.status(400).json({ message: "Missing email for donor" });
      }

      // Send confirmation email to the donor
      const mailOptions = {
        from: ADMIN_EMAIL,
        to: data.Email,
        subject: "Donation Successfully Received - Pillars of Truth",
        html: `
        <h2>Thank You for Your Donation!</h2>
        <p>Dear <strong>${data.Name}</strong>,</p>
        <p>We have successfully received your donation.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Amount:</strong> ₹${data.Amount}</li>
          <li><strong>Purpose:</strong> ${data.Purpose}</li>
          <li><strong>Date:</strong> ${data.TimeStamp}</li>
          <li><strong>Reference ID:</strong> ${data.UniqueId}</li>
        </ul>
        <p>We truly appreciate your support and generosity.</p>
        <p>Warm regards,<br/>Pillars of Truth Team</p>
      `,
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: "Donation confirmed and email sent.",
      });
    } catch (err) {
      console.error("Failed to update donation:", err);
      res.status(500).json({ message: "Failed to update donation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
