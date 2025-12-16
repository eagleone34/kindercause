import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { Resend as ResendSDK } from "resend";
import config from "@/config";
import { createClient } from "@supabase/supabase-js";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,

  // Supabase adapter for storing users, accounts, sessions, and verification tokens
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),

  // Generate 6-digit OTP
  generateVerificationToken: async () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

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
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        const resend = new ResendSDK(process.env.RESEND_API_KEY);

        const { error } = await resend.emails.send({
          from: config.resend.fromNoReply || "KinderCause <noreply@kindercause.com>",
          to: email,
          subject: `Sign in code: ${token}`,
          html: `
            <body style="background: #f9f9f9; font-family: sans-serif; padding: 20px;">
              <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Sign in to KinderCause</h2>
                <p style="color: #666; font-size: 16px;">Enter the following code to sign in:</p>
                <div style="background: #f4f4f5; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #000;">
                  ${token}
                </div>
                <p style="color: #888; font-size: 14px;">This code will expire in 24 hours.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #aaa;">
                  If you didn't request this email, you can safely ignore it.
                </div>
              </div>
            </body>
          `,
        });

        if (error) {
          console.error("Resend error:", error);
          throw new Error("Failed to send verification email");
        }
      },
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

  events: {
    async createUser({ user }) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const orgName = user.name ? `${user.name}'s Daycare` : "My Daycare";
        // Create a unique slug: my-daycare-[random-string]
        const slug = `my-daycare-${Math.random().toString(36).substring(2, 8)}`;

        const { error } = await supabase
          .from("organizations")
          .insert({
            user_id: user.id,
            name: orgName,
            slug: slug,
            is_nonprofit: false
          });

        if (error) {
          console.error("Error creating organization for new user:", error);
        } else {
          console.log("Automatically created organization for user:", user.id);
        }
      } catch (err) {
        console.error("Error in createUser event:", err);
      }
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
