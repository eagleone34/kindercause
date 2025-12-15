"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import config from "@/config";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages = {
    Configuration: "There's an issue with the server configuration. Please contact support.",
    AccessDenied: "Access was denied. You may not have permission to sign in.",
    Verification: "The verification link has expired or has already been used. Please try signing in again.",
    Default: "An error occurred during sign in. Please try again.",
  };

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <>
      {/* Error Icon */}
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-error">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">Sign In Error</h1>
      <p className="text-base-content/60 mb-6">
        {errorMessage}
      </p>

      {error && (
        <div className="bg-base-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-base-content/50 font-mono">
            Error code: {error}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Link href="/signin" className="btn btn-primary w-full">
          Try Again
        </Link>
        <Link href="mailto:hello@kindercause.com" className="btn btn-outline w-full">
          Contact Support
        </Link>
      </div>
    </>
  );
}

function LoadingContent() {
  return (
    <div className="flex items-center justify-center py-12">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}

export default function AuthErrorPage() {
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
          <div className="bg-base-100 rounded-2xl shadow-xl p-8 text-center">
            <Suspense fallback={<LoadingContent />}>
              <ErrorContent />
            </Suspense>
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
