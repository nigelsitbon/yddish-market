import { prisma } from "@/lib/prisma";

/**
 * Create a payout (Stripe Transfer) for an order item.
 * Called immediately after checkout.session.completed.
 *
 * - If Stripe is configured and the seller is onboarded → create a Stripe Transfer.
 * - If Stripe is not configured (demo mode) → mark as COMPLETED directly.
 * - If the seller is not onboarded → mark as PENDING for later retry.
 *
 * @param orderItemId - The order item to pay out
 * @param chargeId - Optional Stripe charge ID for source_transaction linking
 */
export async function createPayout(orderItemId: string, chargeId?: string) {
  // Fetch order item with seller info
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      seller: {
        select: {
          id: true,
          stripeAccountId: true,
          stripeOnboarded: true,
          commission: true,
          shopName: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          stripePaymentId: true,
          stripeChargeId: true,
        },
      },
    },
  });

  if (!orderItem) {
    throw new Error(`OrderItem ${orderItemId} not found`);
  }

  // Check if payout already exists for this order item
  const existingPayout = await prisma.payout.findFirst({
    where: { orderItemId },
  });

  if (existingPayout) {
    console.log(`[PAYOUT] Already exists for orderItem ${orderItemId}`);
    return existingPayout;
  }

  // Calculate amounts
  const commission = orderItem.commission;
  const shippingAmount = orderItem.shippingAmount;
  const netAmount = orderItem.subtotal - commission + shippingAmount;

  // Determine if we can do a Stripe transfer
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const hasStripe = !!stripeKey && stripeKey.length > 10;
  const sellerOnboarded = orderItem.seller.stripeOnboarded && !!orderItem.seller.stripeAccountId;

  // Case 1: Seller not onboarded → PENDING (will be processed later via retry)
  if (!sellerOnboarded) {
    const payout = await prisma.payout.create({
      data: {
        orderItemId,
        sellerId: orderItem.seller.id,
        amount: netAmount,
        commission,
        shippingAmount,
        status: "PENDING",
      },
    });
    console.log(`[PAYOUT] Created PENDING for orderItem ${orderItemId} (seller not onboarded)`);
    return payout;
  }

  // Case 2: No Stripe configured (demo mode) → COMPLETED directly
  if (!hasStripe) {
    const payout = await prisma.payout.create({
      data: {
        orderItemId,
        sellerId: orderItem.seller.id,
        amount: netAmount,
        commission,
        shippingAmount,
        status: "COMPLETED",
      },
    });
    console.log(`[PAYOUT] Created COMPLETED (demo mode) for orderItem ${orderItemId}`);
    return payout;
  }

  // Case 3: Stripe configured + seller onboarded → create Transfer
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { typescript: true });

    // Amount in cents
    const amountCents = Math.round(netAmount * 100);

    if (amountCents <= 0) {
      console.log(`[PAYOUT] Skipped — net amount is 0 or negative for orderItem ${orderItemId}`);
      const payout = await prisma.payout.create({
        data: {
          orderItemId,
          sellerId: orderItem.seller.id,
          amount: netAmount,
          commission,
          shippingAmount,
          status: "COMPLETED",
          failureReason: "Net amount zero — commission covers full amount",
        },
      });
      return payout;
    }

    // Use chargeId from parameter, or fall back to order's stored chargeId
    const sourceTransaction = chargeId || orderItem.order.stripeChargeId || undefined;

    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "eur",
      destination: orderItem.seller.stripeAccountId!,
      transfer_group: orderItem.order.id,
      description: `YDDISH MARKET — Commande ${orderItem.order.orderNumber} — ${orderItem.seller.shopName}`,
      ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
    });

    const payout = await prisma.payout.create({
      data: {
        orderItemId,
        sellerId: orderItem.seller.id,
        amount: netAmount,
        commission,
        shippingAmount,
        stripeTransferId: transfer.id,
        status: "COMPLETED",
      },
    });
    console.log(`[PAYOUT] Transfer ${transfer.id} → ${orderItem.seller.shopName} (${netAmount}€) for order ${orderItem.order.orderNumber}`);
    return payout;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[PAYOUT] Transfer failed for orderItem ${orderItemId}:`, message);

    const payout = await prisma.payout.create({
      data: {
        orderItemId,
        sellerId: orderItem.seller.id,
        amount: netAmount,
        commission,
        shippingAmount,
        status: "FAILED",
        failureReason: message,
      },
    });
    return payout;
  }
}
