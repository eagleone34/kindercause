"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import config from "@/config";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoadingGoogle(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoadingEmail(true);
    try {
      await signIn("resend", { 
        email,
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Email sign in error:", error);
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="text-2xl">🎁</span>
          <span className="text-xl font-bold text-primary">{config.appName}</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Sign In Card */}
          <div className="bg-base-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome to {config.appName}</h1>
              <p className="text-base-content/60">
                Sign in to manage your fundraisers
              </p>
            </div>

            {/* Email Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourdaycare.com"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingEmail || !email}
                className="btn btn-primary w-full"
              >
                {isLoadingEmail ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Sending link...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    Continue with Email
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-center text-base-content/50 mt-3">
              We&apos;ll send you a magic link to sign in - no password needed!
            </p>

            <div className="divider text-sm text-base-content/40 my-6">or</div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="btn btn-outline w-full gap-3 h-12 text-base font-medium hover:bg-base-200"
            >
              {isLoadingGoogle ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Terms */}
            <p className="text-xs text-center text-base-content/50 mt-6">
              By signing in, you agree to our{" "}
              <Link href="/tos" className="link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="link">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <p className="text-center mt-6">
            <Link href="/" className="text-sm text-base-content/60 hover:text-primary">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
