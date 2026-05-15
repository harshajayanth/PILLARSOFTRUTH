import { z } from "zod";

// =====================================
// EDIT USER SCHEMA
// =====================================
export const editUserSchema =
  z.object({
    username:
      z
        .string()
        .min(
          1,
          "Username is required"
        ),

    phone:
      z
        .string()
        .min(
          10,
          "Phone number is required"
        ),

    age:
      z.coerce
        .number({
          required_error:
            "Age is required",
        })
        .min(
          1,
          "Minimum age is 15"
        )
        .max(
          120,
          "Maximum age is 40"
        ),

    position:
      z.string().optional(),

    location:
      z
        .string()
        .min(
          1,
          "Location is required"
        ),

    bio:
      z
        .string()
        .min(
          10,
          "Bio must be at least 10 characters"
        )
        .max(
          300,
          "Bio must be under 300 characters"
        ),
  });

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  location: z.string().min(1, "Location is required"),
  phone: z.string().min(1, "Phone number is required"),
  age: z.coerce
    .number({
      required_error:
        "Age is required",
    })
    .min(
      1,
      "Minimum age is 15"
    )
    .max(
      120,
      "Maximum age is 40"
    ),
  hearAbout: z.string().min(1, "Please select how you heard about us"),
  message: z.string().min(10, "Please tell us more about yourself"),
  agreeCommunications: z.boolean().refine(val => val === true, "You must agree to receive communications")
});

// Chat message schema
export const chatMessageSchema =
  z.object({
    message:
      z
        .string()
        .min(
          1,
          "Message is required"
        )
        .max(
          1000,
          "Message is too long"
        ),
    subject: z
      .string()
      .min(1)
      .max(200),

    route:
      z.enum([
        "admin",
        "members",
        "youth_leaders",
        "organisation",
        "communication",
      ]),

    senderEmail:
      z
        .string()
        .email(
          "Valid sender email required"
        ),
  });



export const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  fromtime: z.string(),
  totime: z.string(),
  file: z.string(),
  venue: z.string(),
  organiser:z.string(),
  event:z.string()
});


// Session content schema
export const sessionContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["recording", "chapter"]),
  description: z.string(),
  fileUrl: z.string().url(),
  duration: z.string().optional(), // for recordings
  pages: z.string().optional(), // for chapters
  createdAt: z.string()
});

// Gallery item schema
export const galleryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  createdAt: z.string()
});

// Auth user schema
export const authUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  picture: z.string(),
  role:z.string(),
  isAuthenticated: z.boolean()
});

// Types
export type ContactForm = z.infer<typeof contactFormSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type SessionContent = z.infer<typeof sessionContentSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
