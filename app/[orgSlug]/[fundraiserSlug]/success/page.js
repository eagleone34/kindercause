import Link from "next/link";
import { createAdminSupabaseClient } from "@/libs/supabase";
import config from "@/config";

// Success page after successful checkout
export default async function SuccessPage({ params, searchParams }) {
  const { orgSlug, fundraiserSlug } = await params;
  // const { session_id } = use(searchParams);

  const supabase = createAdminSupabaseClient();

  // Fetch fundraiser details
  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select(`
      name,
      type,
      organizations!inner(name, slug)
    `)
    .eq("slug", fundraiserSlug)
    .eq("organizations.slug", orgSlug)
    .single();

  const isEvent = fundraiser?.type === "event";

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-box shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-10 h-10 text-success"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">
          {isEvent ? "You're In! 🎉" : "Thank You! 💝"}
        </h1>
        <p className="text-base-content/70 mb-6">
          {isEvent
            ? "Your tickets have been confirmed!"
            : "Your donation has been received!"}
        </p>

        {/* Fundraiser Info */}
        {fundraiser && (
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-base-content/60 mb-1">
              {isEvent ? "Event" : "Campaign"}
            </p>
            <p className="font-semibold">{fundraiser.name}</p>
            <p className="text-sm text-base-content/60">
              {fundraiser.organizations.name}
            </p>
          </div>
        )}

        {/* What's Next */}
        <div className="space-y-3 text-left bg-base-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-sm">What happens next:</h3>
          <ul className="space-y-2 text-sm text-base-content/70">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>Confirmation email sent to your inbox</span>
            </li>
            {isEvent && (
              <li className="flex items-start gap-2">
                <span className="text-success">✓</span>
                <span>QR code ticket attached to email</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              <span>
                {isEvent
                  ? "Show QR code at check-in"
                  : "Tax receipt will be emailed"}
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/${orgSlug}/${fundraiserSlug}`}
            className="btn btn-primary w-full"
          >
            {isEvent ? "View Event" : "View Campaign"}
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to {config.appName}
          </Link>
        </div>

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-base-300">
          <p className="text-sm text-base-content/60 mb-3">
            Help spread the word!
          </p>
          <div className="flex justify-center gap-2">
            <button
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.origin + "/" + orgSlug + "/" + fundraiserSlug
                    )}`,
                    "_blank"
                  );
                }
              }}
              aria-label="Share on Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      window.location.origin + "/" + orgSlug + "/" + fundraiserSlug
                    )}&text=${encodeURIComponent(
                      isEvent
                        ? `I just got tickets to ${fundraiser?.name}! 🎉`
                        : `I just donated to ${fundraiser?.name}! 💝`
                    )}`,
                    "_blank"
                  );
                }
              }}
              aria-label="Share on Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(
                    window.location.origin + "/" + orgSlug + "/" + fundraiserSlug
                  );
                  alert("Link copied!");
                }
              }}
              aria-label="Copy link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
