import { z } from "zod";

export const sellerOnboardingSchema = z.object({
  shopName: z.string().min(2, "Le nom de la boutique doit contenir au moins 2 caractères").max(50),
  description: z.string().max(500).optional(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  street: z.string().min(1, "L'adresse est requise"),
  street2: z.string().optional(),
  city: z.string().min(1, "La ville est requise"),
  zip: z.string().min(1, "Le code postal est requis"),
  country: z.string().default("FR"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
