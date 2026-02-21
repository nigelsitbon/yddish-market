import { z } from "zod";

export const updateShippingSchema = z.object({
  shippingDomestic: z.number().min(0).max(100).optional(),
  shippingEU: z.number().min(0).max(200).optional(),
  shippingInternational: z.number().min(0).max(500).optional(),
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  handlingDays: z.number().int().min(1).max(30).optional(),
  shipsFrom: z.string().length(2).optional(),
});

export type UpdateShippingInput = z.infer<typeof updateShippingSchema>;
