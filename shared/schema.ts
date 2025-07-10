import { z } from "zod";

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  ageGroup: z.enum(["13-17", "18-22", "23-30"]),
  hearAbout: z.enum(["friend", "church", "social", "other"]).optional(),
  message: z.string().min(10, "Please tell us more about yourself"),
  agreeCommunications: z.boolean().refine(val => val === true, "You must agree to receive communications")
});

// Chat message schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  route: z.enum(["admin", "members"]),
  senderEmail: z.string().email().optional()
});

// Session content schema
export const sessionContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  session: z.number().min(1).max(3),
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
  isAuthenticated: z.boolean()
});

// Types
export type ContactForm = z.infer<typeof contactFormSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type SessionContent = z.infer<typeof sessionContentSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
