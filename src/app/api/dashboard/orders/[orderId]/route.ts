import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateOrderItemStatusSchema } from "@/lib/validators/order";
import { createPayout } from "@/lib/payouts";
import { getTrackingUrl } from "@/lib/carriers";
import { sendShippingNotificationEmail } from "@/lib/emails";

/* ── PATCH /api/dashboard/orders/[orderId] — Mettre à jour le statut ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { orderId: orderItemId } = await params;

    // Verify ownership
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: orderItemId, sellerId: user.sellerProfile.id },
    });
    if (!orderItem) {
      return NextResponse.json(
        { success: false, error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateOrderItemStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { status, carrier, trackingNumber, trackingUrl } = parsed.data;

    const updateData: Record<string, unknown> = { status };
    if (carrier) updateData.carrier = carrier;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    // Auto-generate tracking URL from carrier + tracking number
    if (carrier && trackingNumber) {
      updateData.trackingUrl = getTrackingUrl(carrier, trackingNumber);
    } else if (trackingUrl) {
      updateData.trackingUrl = trackingUrl;
    }
    if (status === "SHIPPED") updateData.shippedAt = new Date();
    if (status === "DELIVERED") updateData.deliveredAt = new Date();

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: updateData,
      include: {
        order: {
          include: {
            buyer: { select: { email: true, name: true } },
          },
        },
        product: { select: { title: true } },
        seller: { select: { shopName: true } },
      },
    });

    // Send shipping notification email when shipped
    if (status === "SHIPPED") {
      try {
        await sendShippingNotificationEmail({
          buyerEmail: updated.order.buyer.email,
          buyerName: updated.order.buyer.name || "Client",
          orderNumber: updated.order.orderNumber,
          sellerName: updated.seller.shopName,
          productTitle: updated.product.title,
          carrier: updated.carrier,
          trackingUrl: updated.trackingUrl,
          trackingNumber: updated.trackingNumber,
        });
      } catch (emailErr) {
        console.error("[SHIPPING_EMAIL_ERROR]", emailErr);
      }
    }

    // Trigger payout when order is delivered
    if (status === "DELIVERED") {
      try {
        await createPayout(orderItemId);
      } catch (payoutErr) {
        console.error("[PAYOUT_ERROR]", payoutErr);
        // Don't block the status update — payout failure is logged separately
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[DASHBOARD_ORDER_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
