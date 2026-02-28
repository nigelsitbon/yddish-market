import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";

/* ── POST /api/dashboard/stripe-connect — Créer compte + lien onboarding ── */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
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

    let accountId = user.sellerProfile.stripeAccountId;

    // Créer un compte Express si pas encore fait
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: user.sellerProfile.shipsFrom || "FR",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: user.sellerProfile.shopName,
          product_description: "Artisanat et culture judaïque — YDDISH MARKET",
        },
        metadata: {
          sellerId: user.sellerProfile.id,
          platform: "yddish-market",
        },
      });

      accountId = account.id;

      await prisma.sellerProfile.update({
        where: { id: user.sellerProfile.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Générer un Account Link pour l'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/dashboard/settings?stripe=refresh`,
      return_url: `${APP_URL}/dashboard/settings?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      data: { url: accountLink.url },
    });
  } catch (error) {
    console.error("[STRIPE_CONNECT_POST]", error);
    return NextResponse.json(
      { success: false, error: `Erreur Stripe Connect: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 },
    );
  }
}
