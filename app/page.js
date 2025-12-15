import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import config from "@/config";

export default function Page() {
  return (
    <>
      {/* Header */}
      <header className="navbar bg-base-100 max-w-7xl mx-auto px-4">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="text-xl font-bold text-primary">{config.appName}</span>
          </Link>
        </div>
        <div className="flex-none gap-2">
          <Link href="#pricing" className="btn btn-ghost btn-sm">
            Pricing
          </Link>
          <Link href="#features" className="btn btn-ghost btn-sm hidden sm:flex">
            Features
          </Link>
          <ButtonSignin text="Login" />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center gap-8 px-4 py-16 bg-gradient-to-b from-base-100 to-base-200">
          <div className="badge badge-primary badge-outline">
            🚀 Built for daycares & preschools
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold max-w-4xl leading-tight">
            Fundraising Made{" "}
            <span className="text-primary">Simple</span>
            <br />
            for Daycares
          </h1>

          <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl">
            Stop juggling Venmo, spreadsheets, and email chains. 
            Create events, collect donations, and manage contacts — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/api/auth/signin" className="btn btn-primary btn-lg">
              Start Free Trial
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="#demo" className="btn btn-outline btn-lg">
              Watch Demo
            </Link>
          </div>

          <p className="text-sm text-base-content/50">
            No credit card required • Free for 14 days • Cancel anytime
          </p>

          {/* Social Proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-primary/20 border-2 border-base-100 flex items-center justify-center text-sm font-medium"
                >
                  {["👩", "👨", "👩‍🦰", "👨‍🦱", "👩‍🦳"][i - 1]}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-base-content/60">
                Loved by 100+ directors
              </p>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-4 bg-base-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Sound Familiar? 😩
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto">
                Directors spend 10-15 hours per fundraiser on admin work
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-base-100 rounded-box p-6 shadow">
                <div className="text-3xl mb-4">💸</div>
                <h3 className="font-semibold mb-2">Chasing Payments</h3>
                <p className="text-base-content/60 text-sm">
                  &quot;Did you Venmo me?&quot; &quot;Check&apos;s in the mail&quot; &quot;Can I pay cash?&quot; 
                  You&apos;re not a collections agency.
                </p>
              </div>
              <div className="bg-base-100 rounded-box p-6 shadow">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="font-semibold mb-2">Spreadsheet Chaos</h3>
                <p className="text-base-content/60 text-sm">
                  RSVPs in one sheet, payments in another, email list somewhere else. 
                  Which version is correct?
                </p>
              </div>
              <div className="bg-base-100 rounded-box p-6 shadow">
                <div className="text-3xl mb-4">📧</div>
                <h3 className="font-semibold mb-2">BCC Nightmares</h3>
                <p className="text-base-content/60 text-sm">
                  Mass emailing 100 parents from Gmail? Missing someone? 
                  Reply-all disasters?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Everything You Need to Fundraise
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto">
                One platform. All your fundraising. Zero headaches.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎟️</span>
                </div>
                <h3 className="font-semibold mb-2">Event Ticketing</h3>
                <p className="text-base-content/60 text-sm">
                  Sell tickets to galas, fundraiser dinners, and parent nights. 
                  QR codes, Apple Pay, automatic confirmations.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💝</span>
                </div>
                <h3 className="font-semibold mb-2">Donation Campaigns</h3>
                <p className="text-base-content/60 text-sm">
                  Launch playground funds, scholarship drives, or emergency appeals. 
                  Progress bars, donor walls, recurring gifts.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2">Contact Management</h3>
                <p className="text-base-content/60 text-sm">
                  Import your parent list with one CSV. Tag, segment, and organize. 
                  No more outdated spreadsheets.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✉️</span>
                </div>
                <h3 className="font-semibold mb-2">Email Campaigns</h3>
                <p className="text-base-content/60 text-sm">
                  Send beautiful announcements to all parents or targeted groups. 
                  No BCC disasters, unsubscribe built-in.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="font-semibold mb-2">Instant Payouts</h3>
                <p className="text-base-content/60 text-sm">
                  Money hits your bank in 2 days. Clear fee breakdown, 
                  monthly statements, tax receipts for donors.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2">Mobile-First</h3>
                <p className="text-base-content/60 text-sm">
                  Parents buy tickets from their phone in 30 seconds. 
                  Apple Pay, Google Pay, credit cards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 bg-base-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto">
                Start free, upgrade when you&apos;re ready. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {config.stripe.plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`bg-base-100 rounded-box p-6 shadow ${
                    plan.isFeatured ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {plan.isFeatured && (
                    <div className="badge badge-primary mb-4">Most Popular</div>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-base-content/60 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    {plan.priceAnchor && (
                      <span className="text-base-content/40 line-through mr-2">
                        ${plan.priceAnchor}
                      </span>
                    )}
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-base-content/60">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-success">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/api/auth/signin"
                    className={`btn w-full ${
                      plan.isFeatured ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-base-content/60 mt-8">
              All plans include Stripe payment processing (2.9% + $0.30 per transaction).
              <br />
              Need a custom plan for your franchise? <Link href="mailto:hello@kindercause.com" className="link">Contact us</Link>
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Simplify Your Fundraising?
            </h2>
            <p className="text-base-content/70 mb-8 max-w-2xl mx-auto">
              Join hundreds of daycares raising more money with less stress.
              Set up your first fundraiser in under 10 minutes.
            </p>
            <Link href="/api/auth/signin" className="btn btn-primary btn-lg">
              Start Your Free Trial
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <aside>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎁</span>
            <span className="text-xl font-bold">{config.appName}</span>
          </div>
          <p>Simple fundraising for daycares & preschools</p>
          <p className="text-sm text-base-content/60">
            © {new Date().getFullYear()} KinderCause. All rights reserved.
          </p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <Link href="/privacy-policy" className="link link-hover">Privacy Policy</Link>
            <Link href="/tos" className="link link-hover">Terms of Service</Link>
            <Link href="mailto:hello@kindercause.com" className="link link-hover">Contact</Link>
          </div>
        </nav>
      </footer>
    </>
  );
}
