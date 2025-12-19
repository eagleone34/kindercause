import { auth } from "@/libs/auth";

// Use the main auth configuration for middleware
// This ensures consistent session handling across the app

export default auth(async function middleware(req) {
  // Middleware runs on matched routes
  // The auth() wrapper provides session data via req.auth
});

// Don't invoke Middleware on API routes, static files, or auth routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|signin|auth).*)",
  ],
};