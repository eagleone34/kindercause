import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import config from "@/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,

  // Supabase adapter for storing users, accounts, sessions, and verification tokens
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: config.resend.fromNoReply,
    }),
  ],

  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/verify",
    error: "/signin/error",
  },

  callbacks: {
    session: async ({ session, token, user }) => {
      if (session?.user) {
        // For JWT strategy, use token.sub
        // For database strategy, use user.id
        session.user.id = token?.sub || user?.id;
      }
      return session;
    },
  },
  
  // Use database sessions for magic links (required for email provider)
  session: {
    strategy: "database",
  },
  
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logoAndName.png`,
  },
});
