"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import config from "@/config";
import toast from "react-hot-toast";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // State
  const [view, setView] = useState(searchParams.get("view") === "signup" ? "signup" : "login"); // 'login' | 'signup' | 'code'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const checkEmailExists = async (email) => {
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data.exists;
    } catch (e) {
      console.error("Check email failed", e);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const exists = await checkEmailExists(email);

      if (view === "login") {
        if (!exists) {
          setError("Account not found. Please sign up.");
          setIsLoading(false);
          return;
        }
      } else if (view === "signup") {
        if (exists) {
          setError("Account already exists. Please log in.");
          setIsLoading(false);
          return;
        }
      }

      // Request OTP
      const res = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl
      });

      if (res?.error) {
        setError("Failed to send code. Please try again.");
      } else {
        setView("code");
        toast.success("Verification code sent to your email!");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Manually construct the callback URL to verify the token
    const verificationUrl = `/api/auth/callback/resend?callbackUrl=${encodeURIComponent(callbackUrl)}&token=${code}&email=${encodeURIComponent(email)}`;

    // Redirect to the verification URL
    router.push(verificationUrl);
  };

  // Render Helpers
  const renderGoogleButton = () => (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      type="button"
      className="btn btn-outline w-full gap-3 h-12 text-base font-medium hover:bg-base-200"
    >
      {isLoading ? (
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
  );

  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="bg-base-100 rounded-2xl shadow-xl p-8">

        {/* Title Section */}
        <div className="text-center mb-8">
          {view === "code" ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-base-content/60">
                We sent a 6-digit code to <span className="font-semibold">{email}</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">
                {view === "signup" ? "Create your account" : `Welcome to ${config.appName}`}
              </h1>
              <p className="text-base-content/60">
                {view === "signup" ? "Get started in minutes" : "Sign in to manage your fundraisers"}
              </p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="alert alert-error text-sm py-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {/* View: LOGIN or SIGNUP */}
        {(view === "login" || view === "signup") && (
          <div className="space-y-4">
            {/* Google Button */}
            {renderGoogleButton()}

            <div className="divider text-sm text-base-content/40 my-4">or</div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                disabled={isLoading || !email}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  view === "signup" ? "Sign Up with Email" : "Continue with Email"
                )}
              </button>
            </form>

            {/* Toggle View */}
            <div className="text-center mt-4">
              {view === "login" ? (
                <p className="text-sm">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setView("signup"); setError(""); }}
                    className="link link-primary font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-sm">
                  Already have an account?{" "}
                  <button
                    onClick={() => { setView("login"); setError(""); }}
                    className="link link-primary font-medium"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* View: VERIFY CODE */}
        {view === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="form-control">
              <label className="label justify-center">
                <span className="label-text font-medium">Verification Code</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="input input-bordered w-full text-center text-2xl tracking-widest"
                required
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Verify & Sign In"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setView("login"); setCode(""); setError(""); }}
                className="text-sm link"
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        {/* Terms Footer */}
        {(view === "login" || view === "signup") && (
          <p className="text-xs text-center text-base-content/50 mt-6">
            By continuing, you agree to our{" "}
            <Link href="/tos" className="link">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="link">Privacy Policy</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
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
        <Suspense fallback={<div className="loading loading-spinner loading-lg text-primary"></div>}>
          <SignInContent />
        </Suspense>
      </main>
    </div>
  );
}
