import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  hospitalName: z.string().min(3, "Hospital name must be at least 3 characters"),
  hospitalCity: z.string().min(2, "City is required"),
  hospitalCountry: z.string().min(2, "Country is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  medicineName: z.string().min(2, "Medicine name is required"),
  genericName: z.string().optional(),
  atcCode: z.string().optional(),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "Expiry date must be in the future"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.number().positive("Price must be positive"),
  currency: z.string().default("EUR"),
  condition: z.enum(["SEALED", "OPENED"]).default("SEALED"),
  categoryId: z.string().optional(),
});

export const createOrderSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  notes: z.string().optional(),
});

export const inviteRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Invitation token is required"),
});

export const createAlertSchema = z.object({
  medicineName: z.string().min(2, "Medicine name must be at least 2 characters"),
  atcCode: z.string().optional(),
  maxDistanceKm: z.number().int().positive().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
