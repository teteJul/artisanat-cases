import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/mon-espace/:path*",
    "/api/admin/:path*",
    // Exclure les fichiers statiques, _next et le webhook Stripe
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
