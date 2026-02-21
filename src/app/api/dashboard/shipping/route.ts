import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateShippingSchema } from "@/lib/validators/shipping";

/* ── GET /api/dashboard/shipping — Paramètres livraison vendeur ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { shippingDomestic, shippingEU, shippingInternational, freeShippingThreshold, handlingDays, shipsFrom } =
      user.sellerProfile;

    return NextResponse.json({
      success: true,
      data: { shippingDomestic, shippingEU, shippingInternational, freeShippingThreshold, handlingDays, shipsFrom },
    });
  } catch (error) {
    console.error("[DASHBOARD_SHIPPING_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH /api/dashboard/shipping — Modifier paramètres livraison ── */
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateShippingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 },
      );
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      data: {
        shippingDomestic: updated.shippingDomestic,
        shippingEU: updated.shippingEU,
        shippingInternational: updated.shippingInternational,
        freeShippingThreshold: updated.freeShippingThreshold,
        handlingDays: updated.handlingDays,
        shipsFrom: updated.shipsFrom,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD_SHIPPING_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
