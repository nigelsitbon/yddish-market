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
  "/cgv",
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

  return NextResponse.next();
});

export const config = {
  // Only run middleware on page routes and API routes.
  // Skip all static files, images, fonts, _next assets, and favicon.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)).*)",
  ],
};
