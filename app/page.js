"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import config from "@/config";
import ButtonCheckout from "@/components/ButtonCheckout";

// Lazy load the demo modal - only loaded when needed
const BookDemoModal = dynamic(() => import("@/components/BookDemoModal"), {
  loading: () => null,
  ssr: false,
});

export default function Page() {
  const { data: session, status } = useSession();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      {/* Demo Booking Modal - Only rendered when opened */}
      {isDemoOpen && (
        <BookDemoModal
          isOpen={isDemoOpen}
          onClose={() => setIsDemoOpen(false)}
        />
      )}

      {/* Header */}
      <header className="navbar bg-base-100 max-w-7xl mx-auto px-4">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span className="text-xl font-bold text-primary">{config.appName}</span>
          </Link>
        </div>
        <div className="flex-none flex items-center gap-2">
          <Link href="#pricing" className="btn btn-ghost btn-sm">
            Pricing
          </Link>
          <Link href="#features" className="btn btn-ghost btn-sm hidden sm:flex">
            Features
          </Link>
          {status === "loading" ? (
            <div className="w-20 h-8 bg-base-200 animate-pulse rounded-lg" />
          ) : session ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/signin" className="btn btn-ghost btn-sm">
              Login
            </Link>
          )}
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
            <button
              onClick={() => setIsDemoOpen(true)}
              className="btn btn-primary btn-lg"
            >
              Book a Demo
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </button>
            <Link href="#pricing" className="btn btn-outline btn-lg">
              Start Free 7 Day Trial
            </Link>
          </div>

          <p className="text-sm text-base-content/50">
            🚀 Launching Soon • Get early access pricing
          </p>
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

            <div className="flex justify-center mb-12">
              <div className="bg-base-100 border-2 border-primary/20 p-4 rounded-lg flex items-center gap-4 shadow-lg max-w-lg mx-auto transform hover:scale-105 transition-transform duration-200">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Launch Special</h3>
                  <p className="text-base-content/80 text-sm">
                    Early adopter pricing applies to the <span className="font-bold text-primary">first 100 customers</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {config.stripe.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-base-100 rounded-box p-6 shadow ${plan.isFeatured ? "ring-2 ring-primary" : ""
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
                  <ButtonCheckout
                    priceId={plan.priceId}
                    mode="subscription"
                    className={`btn w-full ${plan.isFeatured ? "btn-primary" : "btn-outline"
                      }`}
                  >
                    Start your 7 day free trial
                  </ButtonCheckout>
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
              Be among the first daycares to simplify their fundraising.
              Set up your first fundraiser in under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setIsDemoOpen(true)}
                className="btn btn-primary btn-lg"
              >
                Book a Demo
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </button>
              <Link href="#pricing" className="btn btn-outline btn-lg">
                Start Free 7 Day Trial
              </Link>
            </div>
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
