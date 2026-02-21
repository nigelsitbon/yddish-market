import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sellerOnboardingSchema } from "@/lib/validators/user";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    if (user.sellerProfile) {
      return NextResponse.json(
        { success: false, error: "Vous êtes déjà vendeur" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = sellerOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { shopName, description } = parsed.data;
    let slug = slugify(shopName);

    // Ensure slug uniqueness
    const existing = await prisma.sellerProfile.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create seller profile + update user role
    const [sellerProfile] = await prisma.$transaction([
      prisma.sellerProfile.create({
        data: {
          userId: user.id,
          shopName,
          slug,
          description: description || null,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { role: "SELLER" },
      }),
    ]);

    return NextResponse.json({ success: true, data: sellerProfile });
  } catch (error) {
    console.error("[ONBOARDING_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
