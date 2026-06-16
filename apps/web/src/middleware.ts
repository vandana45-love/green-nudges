import { clerkMiddleware } from "@clerk/nextjs/server";

// Middleware runs but does not enforce auth server-side in static mode.
// Auth is enforced client-side (useAuth hooks) + API-level JWT verification.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
