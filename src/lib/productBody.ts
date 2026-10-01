import { z } from "zod";
export const LOOKS = ["softserve", "softserve-cup", "shake", "juice", "coffee", "iced-coffee", "waffle", "crepe", "pancake", "sundae", "cupcake", "croissant", "donut", "cookie", "tub"] as const;
export const ProductBody = z.object({
  categoryId: z.string(),
  nameAr: z.string().trim().min(1).max(60), nameEn: z.string().trim().min(1).max(60),
  descAr: z.string().max(200).default(""), descEn: z.string().max(200).default(""),
  price: z.number().int().min(0),
  sizes: z.array(z.object({ key: z.string().min(1).max(8), nameAr: z.string().min(1).max(20), nameEn: z.string().min(1).max(20), delta: z.number().int() })).max(5).default([]),
  look: z.enum(LOOKS), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  tag: z.enum(["signature", "new"]).nullable().default(null),
  active: z.boolean().default(true),
  imageId: z.string().nullable().optional(),
});
