import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/libs/supabase";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { email, code, callbackUrl } = await req.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: "Email and code are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedCode = code.trim();

        // Hash the code - NextAuth stores hashed tokens
        const hashedCode = crypto
            .createHash("sha256")
            .update(`${normalizedCode}${process.env.NEXTAUTH_SECRET}`)
            .digest("hex");

        console.log("Verify OTP - Looking for:", { normalizedEmail, normalizedCode, hashedCode });

        const supabase = createAdminSupabaseClient();

        // Debug: Check all tokens for this email
        const { data: allTokens } = await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .select("*");

        console.log("All verification tokens in DB:", allTokens);

        // Try with hashed token first
        let { data: tokenData, error: tokenError } = await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .select("*")
            .eq("identifier", normalizedEmail)
            .eq("token", hashedCode)
            .single();

        // If not found with hash, try raw code (in case hashing is disabled)
        if (!tokenData) {
            const { data: rawMatch } = await supabase
                .schema("next_auth")
                .from("verification_tokens")
                .select("*")
                .eq("identifier", normalizedEmail)
                .eq("token", normalizedCode)
                .single();
            tokenData = rawMatch;
        }

        console.log("Token lookup result:", { tokenData, tokenError });

        if (!tokenData) {
            console.error("Token not found. Email:", normalizedEmail, "Code:", normalizedCode, "Hashed:", hashedCode);
            return NextResponse.json(
                { error: "Invalid or expired verification code" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date(tokenData.expires) < new Date()) {
            // Delete expired token
            await supabase
                .schema("next_auth")
                .from("verification_tokens")
                .delete()
                .eq("identifier", normalizedEmail)
                .eq("token", tokenData.token);

            return NextResponse.json(
                { error: "Verification code has expired" },
                { status: 400 }
            );
        }

        // Token is valid - delete it (single-use)
        await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .delete()
            .eq("identifier", normalizedEmail)
            .eq("token", tokenData.token);

        // Get or create user
        let { data: user } = await supabase
            .schema("next_auth")
            .from("users")
            .select("*")
            .eq("email", normalizedEmail)
            .single();

        if (!user) {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .schema("next_auth")
                .from("users")
                .insert({
                    email: normalizedEmail,
                    "emailVerified": new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
                console.error("Error creating user:", createError);
                return NextResponse.json(
                    { error: "Failed to create user" },
                    { status: 500 }
                );
            }

            user = newUser;

            // Create organization for new user
            const orgName = "My Daycare";
            const slug = `my-daycare-${Math.random().toString(36).substring(2, 8)}`;

            await supabase.from("organizations").insert({
                user_id: user.id,
                name: orgName,
                slug: slug,
                is_nonprofit: false,
            });
        } else {
            // Update emailVerified if not set
            if (!user.emailVerified) {
                await supabase
                    .schema("next_auth")
                    .from("users")
                    .update({ "emailVerified": new Date().toISOString() })
                    .eq("id", user.id);
            }
        }

        // Create a session
        const sessionToken = crypto.randomUUID();
        const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const { error: sessionError } = await supabase
            .schema("next_auth")
            .from("sessions")
            .insert({
                "sessionToken": sessionToken,
                "userId": user.id,
                expires: sessionExpiry.toISOString(),
            });

        if (sessionError) {
            console.error("Error creating session:", sessionError);
            return NextResponse.json(
                { error: "Failed to create session" },
                { status: 500 }
            );
        }

        // Set the session cookie
        const cookieStore = await cookies();
        const isProduction = process.env.NODE_ENV === "production";
        const cookieName = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

        cookieStore.set(cookieName, sessionToken, {
            expires: sessionExpiry,
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
        });

        return NextResponse.json({
            success: true,
            redirectUrl: callbackUrl || "/dashboard",
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
