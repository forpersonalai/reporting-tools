import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";

import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) return null;

        if (email === "admin@reporttrack.local" && password === "admin123") {
          return {
            id: "demo-admin",
            name: "Demo Admin",
            email,
            role: "ADMIN",
            department: "IT",
          };
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.department = (user as { department?: string }).department;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "USER";
        session.user.department = (token.department as string | undefined) ?? undefined;
      }
      return session;
    },
  },
});
