import Link from "next/link";
import config from "@/config";

export default function VerifyPage() {
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
            {/* Email Icon */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-base-content/60 mb-6">
              We sent you a magic link to sign in. Click the link in your email to continue.
            </p>

            <div className="bg-base-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-base-content/70">
                <strong>Tip:</strong> Check your spam folder if you don&apos;t see the email in your inbox.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/signin" className="btn btn-outline w-full">
                ← Back to Sign In
              </Link>
            </div>
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
