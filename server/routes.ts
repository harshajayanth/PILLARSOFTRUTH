import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  contactFormSchema,
  chatMessageSchema,
  SessionContent,
  GalleryItem,
  AuthUser,
} from "@shared/schema";
import nodemailer from "nodemailer";
import session from "express-session";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drive } from "server/utils/googleDrive";

dotenv.config();

import { google } from "googleapis";
import { log } from "console";

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
const SESSION_SECRET = process.env.SESSION_SECRET || "supersecret";

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

    const userEmail = userInfo.email?.toLowerCase();
    if (!userEmail) {
      return res.redirect("/?auth=error&reason=missing_email");
    }

    // 🔍 Check if email exists in members_email.json
    let existingEmails: string[] = [];
    try {
      const raw = fs.readFileSync(MEMBERS_FILE_PATH, "utf-8");
      existingEmails = JSON.parse(raw).map((email: string) => email.toLowerCase());
    } catch (err) {
      console.warn("⚠️ Members file not found or unreadable.");
    }

    const isMember = existingEmails.includes(userEmail);

    if (!isMember) {
      console.warn(`❌ Unauthorized login attempt by: ${userEmail}`);
      return res.redirect("/?auth=unauthorized"); // You can show a toast on frontend
    }

    const user: AuthUser = {
      email: userInfo.email!,
      name: userInfo.name!,
      picture: userInfo.picture!,
      isAuthenticated: true,
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
      const access_token = (req.session as any).access_token;

      if (!user?.isAuthenticated || !access_token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      oauth2Client.setCredentials({ access_token });

      const sessionFilter = req.query.session
        ? parseInt(req.query.session as string)
        : undefined;

      const response = await drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
        fields:
          "files(id, name, mimeType, webViewLink, webContentLink, createdTime, description)",
        orderBy: "createdTime desc",
      });

      const files = response.data.files || [];

      const content: SessionContent[] = files.map((file) => {
        const sessionMatch = file.name?.match(/Session\s*(\d+)/i);
        const session = sessionMatch ? parseInt(sessionMatch[1]) : 1;
        const isAudio =
          file.mimeType?.includes("audio") ||
          file.name?.match(/\.(mp3|wav|m4a)$/i);
        const type = isAudio ? "recording" : "chapter";

        return {
          id: file.id!,
          title: file.name?.replace(/\.[^/.]+$/, "") || "Untitled",
          session,
          type: type as "recording" | "chapter",
          description: file.description || "No description available",
          fileUrl: file.webViewLink || file.webContentLink || "",
          duration: isAudio ? "25:30" : undefined,
          pages: !isAudio ? "12 pages" : undefined,
          createdAt: file.createdTime || new Date().toISOString(),
        };
      });

      const filteredContent = sessionFilter
        ? content.filter((item) => item.session === sessionFilter)
        : content;

      res.json(filteredContent);
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
        imageUrl: `https://drive.google.com/uc?export=view&id=${file.id}`,
        createdAt: file.createdTime || new Date().toISOString(),
      }));


      
      res.json(galleryItems);
    } catch (error) {
      console.error("Gallery fetch error:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  // --- CONTACT FORM ---
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const validation = contactFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({
            message: "Invalid form data",
            errors: validation.error.errors,
          });
      }

      const formData = validation.data;

      let existingEmails: string[] = [];
      try {
        const raw = fs.readFileSync(MEMBERS_FILE_PATH, "utf-8");
        existingEmails = JSON.parse(raw);
      } catch (err) {
        console.warn("Members file not found, creating new.");
      }

      if (!existingEmails.includes(formData.email)) {
        existingEmails.push(formData.email);
        fs.writeFileSync(
          MEMBERS_FILE_PATH,
          JSON.stringify(existingEmails, null, 2)
        );
      }

      const mailOptions = {
        from: ADMIN_EMAIL,
        to: ADMIN_EMAIL,
        subject: "New Community Member Application",
        html: `
          <h2>New Community Member Application</h2>
          <p><strong>Name:</strong> ${formData.firstName} ${
          formData.lastName
        }</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
          <p><strong>Age Group:</strong> ${formData.ageGroup}</p>
          <p><strong>Heard about us:</strong> ${
            formData.hearAbout || "Not specified"
          }</p>
          <p><strong>Message:</strong></p>
          <p>${formData.message}</p>
          <p><strong>Agreed to communications:</strong> ${
            formData.agreeCommunications ? "Yes" : "No"
          }</p>
        `,
      };

      await transporter.sendMail(mailOptions);

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

  // --- MEMBER EMAIL CHECK ---
  app.post("/api/auth/check-member", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ exists: false, message: "No email provided" });
      }

      let existingEmails: string[] = [];
      try {
        const raw = fs.readFileSync(MEMBERS_FILE_PATH, "utf-8");
        existingEmails = JSON.parse(raw);
      } catch (err) {
        console.warn("Members file not found, treating as empty list.");
      }

      const exists = existingEmails.includes(email.toLowerCase());

      return res.json({ exists });
    } catch (err) {
      console.error("Error checking member:", err);
      return res
        .status(500)
        .json({ exists: false, error: "Internal server error" });
    }
  });

  // --- CHAT MESSAGE ---
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const validation = chatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({
            message: "Invalid message data",
            errors: validation.error.errors,
          });
      }

      const { message, route } = validation.data;
      const recipientEmail = route === "admin" ? ADMIN_EMAIL : MEMBER_EMAIL;

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

  const httpServer = createServer(app);
  return httpServer;
}
