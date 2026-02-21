import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return NextResponse.json(
        { error: "No email found" },
        { status: 400 }
      );
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.create({
      data: {
        clerkId: id,
        email,
        name,
        avatar: image_url ?? null,
      },
    });
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: email ?? undefined,
        name,
        avatar: image_url ?? null,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await prisma.user.delete({
        where: { clerkId: id },
      }).catch(() => {
        // User may not exist in our DB
      });
    }
  }

  return NextResponse.json({ success: true });
}
