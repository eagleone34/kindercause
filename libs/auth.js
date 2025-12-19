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



  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
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
      // Generate 6-digit OTP code
      generateVerificationToken: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        const resend = new ResendSDK(process.env.RESEND_API_KEY);

        const { error } = await resend.emails.send({
          from: config.resend.fromNoReply || "KinderCause <noreply@kindercause.com>",
          to: email,
          subject: `Your KinderCause verification code: ${token}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="background: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 20px; margin: 0;">
              <div style="max-width: 420px; margin: 0 auto; background: white; padding: 40px 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color: #10b981; margin: 0 0 10px 0; font-size: 24px;">🎁 KinderCause</h1>
                <h2 style="color: #333; margin: 0 0 20px 0; font-weight: 500;">Sign in to your account</h2>
                
                <p style="color: #666; font-size: 16px; margin-bottom: 25px;">Enter this code on the sign-in page:</p>
                
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; margin: 0 auto 25px auto; max-width: 200px;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; font-family: 'Monaco', 'Menlo', monospace;">${token}</span>
                </div>
                
                <p style="color: #888; font-size: 14px; margin-bottom: 30px;">This code will expire in <strong>10 minutes</strong>.</p>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                  <p style="font-size: 12px; color: #aaa; margin: 0;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </div>
              </div>
              
              <p style="text-align: center; font-size: 11px; color: #999; margin-top: 20px;">
                © ${new Date().getFullYear()} KinderCause. All rights reserved.
              </p>
            </body>
            </html>
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
