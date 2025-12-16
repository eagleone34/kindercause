import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createAdminSupabaseClient } from "@/libs/supabase";
import config from "@/config";
import CheckoutButton from "./CheckoutButton";

// Public fundraiser page - accessible without authentication
// URL: /[orgSlug]/[fundraiserSlug]

export async function generateMetadata({ params }) {
  const { orgSlug, fundraiserSlug } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: fundraiser } = await supabase
    .from("fundraisers")
    .select(`
      name,
      description,
      type,
      organizations!inner(name, slug)
    `)
    .eq("slug", fundraiserSlug)
    .eq("organizations.slug", orgSlug)
    .eq("status", "active")
    .single();

  if (!fundraiser) {
    return { title: "Fundraiser Not Found" };
  }

  return {
    title: `${fundraiser.name} | ${fundraiser.organizations.name}`,
    description: fundraiser.description || `Support ${fundraiser.organizations.name}`,
  };
}

export default async function PublicFundraiserPage({ params }) {
  const { orgSlug, fundraiserSlug } = await params;
  const supabase = createAdminSupabaseClient();

  // Fetch fundraiser with organization details
  const { data: fundraiser, error } = await supabase
    .from("fundraisers")
    .select(`
      *,
      organizations!inner(
        id,
        name,
        slug,
        logo_url,
        is_nonprofit
      )
    `)
    .eq("slug", fundraiserSlug)
    .eq("organizations.slug", orgSlug)
    .eq("status", "active")
    .single();

  if (error || !fundraiser) {
    notFound();
  }

  const isEvent = fundraiser.type === "event";
  const org = fundraiser.organizations;

  // Calculate progress for campaigns
  const progress = fundraiser.goal_amount
    ? Math.min((fundraiser.current_amount / fundraiser.goal_amount) * 100, 100)
    : 0;

  // Check if event is sold out
  const isSoldOut = isEvent && fundraiser.capacity && fundraiser.tickets_sold >= fundraiser.capacity;

  // Format date
  const eventDate = new Date(fundraiser.start_date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 border-b border-base-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <span className="font-bold text-primary">{config.appName}</span>
          </Link>
          <div className="text-sm text-base-content/60">
            Fundraising for {org.name}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image */}
            <div className="aspect-video bg-base-100 rounded-box overflow-hidden shadow relative">
              {fundraiser.image_url ? (
                <Image
                  src={fundraiser.image_url}
                  alt={fundraiser.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span className="text-8xl">{isEvent ? "🎟️" : "💝"}</span>
                </div>
              )}
            </div>

            {/* Organization */}
            <div className="flex items-center gap-3">
              {org.logo_url ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={org.logo_url}
                    alt={org.name}
                    fill
                    className="rounded-full object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🏫</span>
                </div>
              )}
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-base-content/60">
                  {org.is_nonprofit ? "501(c)(3) Nonprofit" : "Organizer"}
                </p>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{fundraiser.name}</h1>
              {fundraiser.description && (
                <div className="prose prose-sm max-w-none text-base-content/80">
                  <p>{fundraiser.description}</p>
                </div>
              )}
            </div>

            {/* Event Details */}
            {isEvent && (
              <div className="bg-base-100 rounded-box p-6 shadow space-y-4">
                <h2 className="font-semibold">Event Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{formattedDate}</p>
                      <p className="text-sm text-base-content/60">{formattedTime}</p>
                    </div>
                  </div>
                  {fundraiser.location && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-base-content/60">{fundraiser.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Purchase/Donate Card */}
          <div className="lg:col-span-2">
            <div className="bg-base-100 rounded-box shadow p-6 sticky top-8">
              {isEvent ? (
                /* Event Ticket Purchase */
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-base-content/60 mb-1">Ticket Price</p>
                    <p className="text-4xl font-bold text-primary">
                      ${fundraiser.ticket_price}
                    </p>
                    <p className="text-sm text-base-content/60">per person</p>
                  </div>

                  {fundraiser.capacity && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{fundraiser.tickets_sold} sold</span>
                        <span>{fundraiser.capacity - fundraiser.tickets_sold} remaining</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={fundraiser.tickets_sold}
                        max={fundraiser.capacity}
                      />
                    </div>
                  )}

                  {isSoldOut ? (
                    <button className="btn btn-disabled w-full" disabled>
                      Sold Out
                    </button>
                  ) : (
                    <CheckoutButton
                      fundraiser={fundraiser}
                      type="event"
                    />
                  )}
                </>
              ) : (
                /* Donation Campaign */
                <>
                  {fundraiser.goal_amount && (
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-primary">
                          ${fundraiser.current_amount?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-base-content/60">
                          raised of ${fundraiser.goal_amount?.toLocaleString()} goal
                        </p>
                      </div>
                      <progress
                        className="progress progress-primary w-full h-3"
                        value={progress}
                        max={100}
                      />
                      <p className="text-center text-sm text-base-content/60 mt-2">
                        {Math.round(progress)}% funded
                      </p>
                    </div>
                  )}

                  <CheckoutButton
                    fundraiser={fundraiser}
                    type="donation"
                  />

                  {fundraiser.allow_recurring && (
                    <p className="text-center text-sm text-base-content/60 mt-3">
                      💝 Monthly giving available at checkout
                    </p>
                  )}
                </>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-base-300">
                <div className="flex items-center justify-center gap-4 text-base-content/50">
                  <div className="flex items-center gap-1 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    Secure
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                    Stripe
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donor Wall (for campaigns with show_donor_wall enabled) */}
        {!isEvent && fundraiser.show_donor_wall && (
          <div className="mt-12 bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Recent Supporters</h2>
            <p className="text-base-content/60 text-sm">
              Be the first to support this campaign!
            </p>
            {/* TODO: Fetch and display donors */}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-base-content/60">
          <p>
            Powered by{" "}
            <Link href="/" className="link link-primary">
              {config.appName}
            </Link>
            {" "}• Simple fundraising for daycares
          </p>
        </div>
      </footer>
    </div>
  );
}
