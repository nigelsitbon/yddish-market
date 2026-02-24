import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const sellerId = user.sellerProfile.id;
    const profile = user.sellerProfile;

    // Parallel queries
    const [totalProducts, activeProducts] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
    ]);

    // Determine step completion
    const shopCreated = true; // Always true if they have a seller profile
    const shopCustomized = !!(profile.description && profile.description.length > 10);
    const shippingConfigured =
      profile.shippingDomestic !== 6.9 ||
      profile.shippingEU !== 12.9 ||
      profile.shippingInternational !== 24.9 ||
      profile.freeShippingThreshold !== null;
    const stripeConnected = profile.stripeOnboarded;
    const firstProductCreated = totalProducts > 0;
    const firstProductPublished = activeProducts > 0;

    const steps = [
      { id: "shop_created", label: "Créer votre boutique", description: "Inscrivez-vous comme vendeur", completed: shopCreated, href: "/dashboard/settings" },
      { id: "shop_customized", label: "Personnaliser votre boutique", description: "Ajoutez une description à votre boutique", completed: shopCustomized, href: "/dashboard/settings" },
      { id: "shipping_configured", label: "Configurer la livraison", description: "Définissez vos tarifs d'expédition", completed: shippingConfigured, href: "/dashboard/shipping" },
      { id: "stripe_connected", label: "Connecter Stripe", description: "Activez les paiements pour recevoir vos ventes", completed: stripeConnected, href: "/dashboard/settings" },
      { id: "first_product", label: "Ajouter un produit", description: "Créez votre première fiche produit", completed: firstProductCreated, href: "/dashboard/products/new" },
      { id: "first_published", label: "Publier un produit", description: "Mettez votre premier produit en vente", completed: firstProductPublished, href: "/dashboard/products" },
    ];

    const completedCount = steps.filter((s) => s.completed).length;

    return NextResponse.json({
      success: true,
      data: {
        steps,
        completedCount,
        totalSteps: steps.length,
        allComplete: completedCount === steps.length,
        progress: Math.round((completedCount / steps.length) * 100),
      },
    });
  } catch (error) {
    console.error("[ONBOARDING_STATUS]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
