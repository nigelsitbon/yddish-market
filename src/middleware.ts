import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/products(.*)",
  "/seller/(.*)",
  "/cart",
  "/checkout(.*)",
  "/become-seller",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // API routes: let them through — each API handler checks auth/role internally via getCurrentUser()
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Dashboard pages: any authenticated user can access (role check done in components via getCurrentUser)
  // This avoids the issue where Clerk session claims don't reflect Prisma role updates
  // A non-seller user accessing /dashboard will be handled by the dashboard layout/components

  // Admin pages: role check is done in the admin layout via getCurrentUser()
  // (Clerk session claims may not reflect Prisma role updates)

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
