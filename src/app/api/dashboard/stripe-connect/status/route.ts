import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── GET /api/dashboard/stripe-connect/status — Vérifier statut onboarding ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { stripeAccountId } = user.sellerProfile;

    if (!stripeAccountId) {
      return NextResponse.json({
        success: true,
        data: { onboarded: false, chargesEnabled: false, detailsSubmitted: false },
      });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { success: false, error: "Stripe n'est pas configuré" },
        { status: 503 },
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { typescript: true });

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const onboarded = !!(account.charges_enabled && account.details_submitted);

    // Mettre à jour le statut en DB si ça a changé
    if (onboarded !== user.sellerProfile.stripeOnboarded) {
      await prisma.sellerProfile.update({
        where: { id: user.sellerProfile.id },
        data: { stripeOnboarded: onboarded },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        onboarded,
        chargesEnabled: account.charges_enabled ?? false,
        detailsSubmitted: account.details_submitted ?? false,
      },
    });
  } catch (error) {
    console.error("[STRIPE_CONNECT_STATUS]", error);
    return NextResponse.json(
      { success: false, error: `Erreur: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 },
    );
  }
}
