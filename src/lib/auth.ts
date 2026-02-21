import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated user from Clerk + Prisma.
 * Auto-creates the DB user if authenticated via Clerk but missing in DB
 * (handles the case where Clerk webhook is not configured).
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { sellerProfile: true },
  });

  // Auto-sync: if Clerk user exists but not in our DB, create them
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const name = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ") || null;

    try {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          avatar: clerkUser.imageUrl ?? null,
        },
        include: { sellerProfile: true },
      });
    } catch (err: unknown) {
      // Handle race condition: user might have been created between findUnique and create
      if (
        err instanceof Error &&
        err.message.includes("Unique constraint")
      ) {
        user = await prisma.user.findUnique({
          where: { clerkId },
          include: { sellerProfile: true },
        });
      } else {
        console.error("[AUTO_SYNC_USER]", err);
        return null;
      }
    }
  }

  return user;
}
