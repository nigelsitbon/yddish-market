import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://yddishmarket.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/become-seller`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/sellers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgv`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic: all active products
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: all seller pages
  const sellers = await prisma.sellerProfile.findMany({
    where: { verified: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const sellerPages: MetadataRoute.Sitemap = sellers.map((s) => ({
    url: `${BASE_URL}/seller/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: category filter pages
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...sellerPages, ...categoryPages];
}
