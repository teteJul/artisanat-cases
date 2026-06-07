import type { NextAuthConfig } from "next-auth";

// Config légère sans bcryptjs — utilisable dans le middleware Edge
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "ADMIN";
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isClientRoute = nextUrl.pathname.startsWith("/mon-espace");

      if (isAdminRoute) {
        if (isLoggedIn && !isAdmin) {
          return Response.redirect(new URL("/mon-espace", nextUrl));
        }
        return isAdmin;
      }
      if (isClientRoute) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
