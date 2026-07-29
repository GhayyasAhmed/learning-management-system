import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth/next";
import GithubProvider from "next-auth/providers/github";

// Module augmentation to extend NextAuth's built-in types safely
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    provider?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Persist the OAuth provider's access token (and which provider issued
    // it) onto the NextAuth JWT so the client can forward proof of a
    // verified provider identity to the backend. The backend independently
    // re-verifies this token against the provider itself before trusting
    // any identity derived from it — the client is never trusted to supply
    // identity (e.g. email) on its own.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      return session;
    },
  },
};

export default NextAuth(authOptions);