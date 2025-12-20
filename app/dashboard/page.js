import Link from "next/link";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

export const dynamic = "force-dynamic";

// Dashboard Overview Page
// Shows key metrics and quick actions
export default async function Dashboard() {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "there";

  // Fetch real data from Supabase
  const supabase = createAdminSupabaseClient();

  // Get user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", session?.user?.id)
    .single();

  let stats = {
    totalRaised: 0,
    activeFundraisers: 0,
    totalContacts: 0,
    pendingPayouts: 0,
  };

  let recentFundraisers = [];

  if (org) {
    // Get fundraiser stats
    const { data: fundraisers } = await supabase
      .from("fundraisers")
      .select("id, name, type, status, current_amount, tickets_sold, ticket_price, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    if (fundraisers) {
      stats.activeFundraisers = fundraisers.filter(f => f.status === "active").length;
      stats.totalRaised = fundraisers.reduce((sum, f) => sum + (parseFloat(f.current_amount) || 0), 0);
      recentFundraisers = fundraisers.slice(0, 5);
    }

    // Get contact count
    const { count: contactCount } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id);

    stats.totalContacts = contactCount || 0;

    // Get pending payouts (completed purchases not yet paid out)
    const { data: pendingPurchases } = await supabase
      .from("purchases")
      .select("net_amount, fundraiser_id")
      .eq("status", "completed")
      .in("fundraiser_id", fundraisers?.map(f => f.id) || []);

    if (pendingPurchases) {
      stats.pendingPayouts = pendingPurchases.reduce((sum, p) => sum + (parseFloat(p.net_amount) || 0), 0);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-base-content/70 mt-1">
            Here&apos;s what&apos;s happening with your fundraisers
          </p>
        </div>
        <Link
          href="/dashboard/fundraisers/new"
          className="btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Fundraiser
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="stat-title">Total Raised</div>
          <div className="stat-value text-primary">${stats.totalRaised.toLocaleString()}</div>
          <div className="stat-desc">Lifetime fundraising</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <div className="stat-title">Active Fundraisers</div>
          <div className="stat-value text-secondary">{stats.activeFundraisers}</div>
          <div className="stat-desc">Currently running</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div className="stat-title">Contacts</div>
          <div className="stat-value text-accent">{stats.totalContacts}</div>
          <div className="stat-desc">Parents & donors</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          </div>
          <div className="stat-title">Pending Payouts</div>
          <div className="stat-value text-info">${stats.pendingPayouts.toLocaleString()}</div>
          <div className="stat-desc">Ready to deposit</div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/fundraisers/new?type=event"
              className="btn btn-outline btn-sm h-auto py-4 flex-col gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
              </svg>
              <span>Create Event</span>
            </Link>
            <Link
              href="/dashboard/fundraisers/new?type=donation_campaign"
              className="btn btn-outline btn-sm h-auto py-4 flex-col gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span>Start Campaign</span>
            </Link>
            <Link
              href="/dashboard/contacts/import"
              className="btn btn-outline btn-sm h-auto py-4 flex-col gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span>Import Contacts</span>
            </Link>
            <Link
              href="/dashboard/emails/new"
              className="btn btn-outline btn-sm h-auto py-4 flex-col gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <span>Send Email</span>
            </Link>
          </div>
        </div>

        {/* Recent Fundraisers */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Fundraisers</h2>
            <Link href="/dashboard/fundraisers" className="btn btn-ghost btn-sm">
              View All
            </Link>
          </div>

          {recentFundraisers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-medium mb-1">No fundraisers yet</h3>
              <p className="text-base-content/60 text-sm mb-4">
                Create your first event or campaign to get started
              </p>
              <Link
                href="/dashboard/fundraisers/new"
                className="btn btn-primary btn-sm"
              >
                Create Fundraiser
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFundraisers.map((fundraiser) => (
                <Link
                  key={fundraiser.id}
                  href={`/dashboard/fundraisers/${fundraiser.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fundraiser.name}</p>
                    <p className="text-sm text-base-content/60">
                      {fundraiser.type === "event" ? "🎟️ Event" : "💝 Campaign"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      ${(parseFloat(fundraiser.current_amount) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-base-content/60">raised</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started Guide (for new users) */}
      {stats.activeFundraisers === 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-box p-6">
          <h2 className="text-lg font-semibold mb-4">🚀 Getting Started</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium">Set up your organization</h3>
                <p className="text-sm text-base-content/60">
                  Add your daycare name and connect Stripe
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium">Create a fundraiser</h3>
                <p className="text-sm text-base-content/60">
                  Set up an event or donation campaign
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-accent-content rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium">Share with parents</h3>
                <p className="text-sm text-base-content/60">
                  Send the link and watch donations roll in!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
