import Link from "next/link";
import config from "@/config";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-box shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Fundraiser Not Found</h1>
        <p className="text-base-content/70 mb-6">
          This fundraiser may have ended, been removed, or the link might be incorrect.
        </p>
        <div className="space-y-3">
          <Link href="/" className="btn btn-primary w-full">
            Go to {config.appName}
          </Link>
          <p className="text-sm text-base-content/60">
            Think this is a mistake?{" "}
            <a href={`mailto:${config.resend.supportEmail}`} className="link link-primary">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
