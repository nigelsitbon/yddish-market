import { z } from "zod";

export const productVariantSchema = z.object({
  name: z.string().min(1, "Le nom de la variante est requis"),
  sku: z.string().optional(),
  price: z.number().positive("Le prix doit être positif").optional(),
  stock: z.number().int().min(0, "Le stock ne peut pas être négatif").default(0),
});

export const createProductSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  price: z.number().positive("Le prix doit être positif"),
  comparePrice: z.number().positive().optional(),
  categoryIds: z.array(z.string().min(1)).min(1, "Au moins une catégorie requise"),
  images: z.array(z.string().url("URL d'image invalide")).default([]),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  variants: z.array(productVariantSchema).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
