import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/me — lightweight endpoint to get current user context
 * Used by the storefront header to show role-based navigation.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        hasSeller: !!user.sellerProfile,
        sellerSlug: user.sellerProfile?.slug ?? null,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
