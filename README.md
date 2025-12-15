# 🎁 KinderCause

**Simple fundraising for daycares & preschools**

KinderCause is a vertical SaaS platform that helps daycare centers manage their fundraising activities - from event ticketing to donation campaigns, contact management, and email outreach.

## 🌐 URLs

- **Production**: https://kindercause.com (pending deployment)
- **GitHub**: https://github.com/eagleone34/kindercause

## 🎯 Project Overview

### Problem
Daycare centers raise $10,000-30,000 annually through fundraisers but manage them using disconnected tools (Venmo, Google Sheets, email). This creates 10-15 hours of administrative burden per fundraiser.

### Solution
KinderCause provides:
- **Event Ticketing** - Sell tickets to galas, dinners, parent nights
- **Donation Campaigns** - Launch playground funds, scholarship drives
- **Contact Management** - Import and organize parent email lists
- **Email Campaigns** - Send announcements without BCC disasters
- **Payment Processing** - Instant payouts via Stripe Connect

### Target Market
- Boutique preschools (10-100 students)
- Montessori centers
- Private daycares that fundraise 2-4 times per year

## ✅ Completed Features

### Landing Page
- [x] Hero section with value proposition
- [x] Problem/solution messaging
- [x] Feature showcase
- [x] Pricing tiers ($29, $79, $149/month)
- [x] Social proof section
- [x] CTA buttons

### Dashboard
- [x] Authenticated dashboard layout with sidebar navigation
- [x] Overview page with stats cards
- [x] Quick actions grid
- [x] Getting started guide for new users

### Fundraisers Module
- [x] Fundraisers list page
- [x] New fundraiser form (events + campaigns)
- [x] API route for creating fundraisers

### Database
- [x] Complete Supabase schema with:
  - Organizations table
  - Fundraisers table (events + campaigns)
  - Purchases table (tickets + donations)
  - Contacts table
  - Email campaigns table
  - Volunteer shifts/signups (Phase 2)
- [x] Row-Level Security policies
- [x] Auto-update triggers
- [x] Performance indexes

### Infrastructure
- [x] Supabase client library
- [x] Config customized for KinderCause branding
- [x] Environment variables template

## 🚧 Not Yet Implemented

### High Priority (MVP)
- [ ] Stripe Connect integration for payouts
- [ ] Public fundraiser pages (event/donation pages)
- [ ] Stripe Checkout for purchases
- [ ] QR code ticket generation
- [ ] Email notifications (confirmations, receipts)
- [ ] Contact CSV import
- [ ] Basic email campaign sending

### Medium Priority (Phase 2)
- [ ] Volunteer shift management
- [ ] Analytics dashboard
- [ ] Donor wall
- [ ] Recurring donations
- [ ] Tax receipt PDF generation

### Lower Priority (Phase 3)
- [ ] Brightwheel integration
- [ ] White-label branding
- [ ] Advanced analytics
- [ ] Referral program

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript/React
- **Styling**: Tailwind CSS + DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Payments**: Stripe (Checkout + Connect)
- **Email**: Resend + SendGrid
- **Deployment**: Vercel

## 📁 Project Structure

```
kindercause/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth routes
│   │   ├── fundraisers/          # Fundraiser CRUD API
│   │   ├── stripe/               # Stripe webhooks
│   │   └── webhook/              # Other webhooks
│   ├── dashboard/
│   │   ├── fundraisers/          # Fundraiser management
│   │   ├── contacts/             # Contact management
│   │   ├── emails/               # Email campaigns
│   │   └── settings/             # Account settings
│   ├── blog/                     # Blog for SEO
│   └── page.js                   # Landing page
├── components/                   # Reusable UI components
├── libs/
│   ├── supabase.js              # Supabase client
│   ├── stripe.js                # Stripe utilities
│   └── auth.js                  # Auth configuration
├── supabase/
│   └── migrations/              # Database schema
├── config.js                    # App configuration
└── package.json
```

## 🗄️ Data Models

### Organizations
- Represents a daycare using KinderCause
- Links to Stripe Connect account for payouts
- Has unique slug for public URLs

### Fundraisers
- Two types: `event` or `donation_campaign`
- Events have ticket_price, capacity, location
- Campaigns have goal_amount, donor wall options

### Purchases
- Tracks tickets and donations
- Stores Stripe payment references
- Calculates fee breakdown (Stripe + platform fees)

### Contacts
- Parent/donor contact list
- Supports tagging for segmentation
- Tracks donation history

### Email Campaigns
- Bulk email to filtered contacts
- Tracks send status and analytics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account
- Resend account (for transactional email)

### Installation

```bash
# Clone the repository
git clone https://github.com/eagleone34/kindercause.git
cd kindercause

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# See .env.example for required variables

# Run database migrations
# (Copy content from supabase/migrations/001_kindercause_schema.sql 
#  to Supabase SQL Editor and run)

# Start development server
npm run dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_ID=
GOOGLE_SECRET=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
SENDGRID_API_KEY=
```

## 📊 Business Model

### Pricing
| Tier | Price | Transaction Fee | Features |
|------|-------|-----------------|----------|
| Starter | $29/mo | 3% | Unlimited events, basic email |
| Growth | $79/mo | 2% | + Volunteers, analytics |
| Pro | $149/mo | 1.5% | + Brightwheel sync, white-label |

### Revenue Targets (12-month)
- 100 customers × $29/mo = $2,900 MRR
- $2M processed × 3% = $60,000 transaction revenue
- **Total ARR: $94,800**

## 📈 Recommended Next Steps

1. **Set up Supabase**: Create project, run migration SQL
2. **Configure Stripe**: Set up products/prices, enable Connect
3. **Build public pages**: Event/donation purchase flows
4. **Implement Stripe Checkout**: Payment processing
5. **Add email notifications**: Purchase confirmations
6. **Deploy to Vercel**: Connect GitHub repo
7. **Beta testing**: Onboard 10 pilot daycares

## 🤝 Contributing

This is a private project. Contact hello@kindercause.com for inquiries.

## 📄 License

Proprietary - All rights reserved.

---

**Founder**: Mazen Al Ashkar  
**Email**: hello@kindercause.com  
**Built with**: [ShipFast](https://shipfa.st) boilerplate
