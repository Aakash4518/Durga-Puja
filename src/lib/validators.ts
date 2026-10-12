import { z } from "zod";

export const stallSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).default(""),
  stallNumber: z.string().trim().max(30).default(""),
  area: z.string().trim().max(80).default(""),
  menu: z.array(z.object({ name: z.string().trim().min(1).max(80), price: z.number().nonnegative().optional() })).max(100).default([]),
  contact: z.string().trim().max(30).default(""),
  phone: z.string().trim().max(30).default(""),
  shopImageUrl: z.string().url().optional().or(z.literal("")),
  shopImages: z.array(z.string().url()).max(20).optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(["draft", "pending", "published", "rejected"]).default("draft"),
});

export const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(""),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  location: z.string().trim().max(120).default(""),
  status: z.enum(["draft", "pending", "published", "cancelled"]).default("draft"),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(2000),
  status: z.enum(["draft", "pending", "published"]).default("draft"),
});

export const mediaSchema = z.object({
  title: z.string().trim().min(2).max(160),
  caption: z.string().trim().max(1000).default(""),
  year: z.number().int().min(2000).max(2100),
  eventName: z.string().trim().max(120).default(""),
  type: z.enum(["image", "video", "document"]),
  provider: z.literal("cloudinary"),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  published: z.boolean().default(false),
});
