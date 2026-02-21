import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateSettingsSchema = z.object({
  shopName: z.string().min(2).max(50).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
});

/* ── GET /api/dashboard/settings — Profil vendeur ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: user.sellerProfile });
  } catch (error) {
    console.error("[DASHBOARD_SETTINGS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH /api/dashboard/settings — Modifier profil vendeur ── */
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[DASHBOARD_SETTINGS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
