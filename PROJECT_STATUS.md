# KinderCause - Project Status

**Last Updated:** December 15, 2025

## 🌐 Live URLs
- **Production:** https://kindercause.com
- **Vercel:** https://kindercause.vercel.app
- **GitHub:** https://github.com/eagleone34/kindercause

## 📊 Current Status: MVP Complete - Pre-Launch

### Pricing Tiers (2 plans)
| Plan | Price | Anchor Price | Transaction Fee |
|------|-------|--------------|-----------------|
| Starter | $49/month | $79 | 3% |
| Growth | $99/month | $149 | 2% |

### ✅ Completed Features

#### Core Platform
- [x] Landing page with hero, features, pricing sections
- [x] Custom sign-in page (`/signin`) with Google OAuth + Email Magic Link
- [x] Email magic link authentication (passwordless via Resend)
- [x] Waitlist capture form (first name, daycare name, email)
- [x] Dashboard layout with sidebar navigation
- [x] Responsive design (mobile + desktop)

#### Fundraising
- [x] Event ticketing (create events, sell tickets)
- [x] Donation campaigns (goal tracking, progress display)
- [x] Public fundraiser pages (`/[org]/[fundraiser]`)
- [x] Stripe Checkout integration

#### Contact Management
- [x] Contact list with search and filtering
- [x] CSV import with column mapping
- [x] Tagging system
- [x] CSV export

#### Email Campaigns
- [x] Campaign list page
- [x] Create new campaigns
- [x] Filter recipients by tags
- [x] SendGrid/Resend integration
- [x] Draft saving

### 🔧 Configuration Required

#### Environment Variables (Vercel)
```
NEXTAUTH_URL=https://kindercause.com
NEXTAUTH_SECRET=(generated)
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://kindercause.com
GOOGLE_ID=(from Google Cloud Console)
GOOGLE_SECRET=(from Google Cloud Console)
NEXT_PUBLIC_SUPABASE_URL=(from Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from Supabase)
SUPABASE_SERVICE_ROLE_KEY=(from Supabase)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(from Stripe)
STRIPE_SECRET_KEY=(from Stripe)
STRIPE_WEBHOOK_SECRET=(from Stripe)
STRIPE_STARTER_PRICE_ID=(from Stripe - $49/month)
STRIPE_GROWTH_PRICE_ID=(from Stripe - $99/month)
```

#### Google OAuth Redirect URIs
```
https://kindercause.com/api/auth/callback/google
https://www.kindercause.com/api/auth/callback/google
```

#### Stripe Webhook
- **Endpoint:** `https://kindercause.com/api/webhook/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.deleted`, `invoice.paid`

### 📁 Database Tables (Supabase)

#### NextAuth Schema (`next_auth.`) - REQUIRED for magic link auth
- `next_auth.users` - Auth users
- `next_auth.accounts` - OAuth provider accounts (Google)
- `next_auth.sessions` - User sessions
- `next_auth.verification_tokens` - Email magic link tokens

#### Public Schema (`public.`)
- `waitlist` - Landing page signups (first_name, daycare_name, email)
- `organizations` - Daycare accounts
- `fundraisers` - Events and campaigns
- `purchases` - Tickets and donations
- `contacts` - Parent email lists
- `email_campaigns` - Email campaigns
- `volunteer_shifts` - (Phase 2)
- `volunteer_signups` - (Phase 2)

### 🚧 Known Issues / TODOs
- [ ] Logo image needs to be added (`/public/logoAndName.png`)
- [ ] Privacy Policy page content
- [ ] Terms of Service page content
- [ ] Demo video for landing page

### 📋 Phase 2 Features (Not Started)
- [ ] Volunteer shift management
- [ ] Analytics dashboard
- [ ] Brightwheel integration
- [ ] White-label branding

## 🔄 Recent Changes

### December 15, 2025 (Latest)
- **Fixed email magic link**: Added Supabase adapter for NextAuth (stores verification tokens)
- Added `@auth/supabase-adapter` package
- Created `002_nextauth_schema.sql` migration (next_auth schema with users, accounts, sessions, verification_tokens)
- Changed session strategy from JWT to database (required for email magic links)
- Added email magic link authentication (passwordless sign-in via Resend)
- Updated sign-in page with email input + Google OAuth options
- Created `/signin/verify` page (check your email)
- Created `/signin/error` page (error handling)
- Updated pricing: Starter $49/month, Growth $99/month
- Created custom sign-in page (`/signin`) with branded design
- Added waitlist modal with form (first name, daycare name, email)
- Created `/api/waitlist` endpoint
- Updated landing page CTAs to "Join Waitlist"
- Removed "Start Free Trial" (replaced with waitlist)
- Updated database schema: renamed `leads` to `waitlist` table

### December 15, 2025 (Earlier)
- Removed Pro pricing tier (now only Starter + Growth)
- Updated hero section - replaced "Loved by 100+ directors" with "Launching Soon" badge
- Updated CTA section - removed misleading "hundreds of daycares" claim
- Fixed MongoDB → Supabase migration (all API routes now use Supabase)
- Fixed authentication (removed MongoDB adapter, Google OAuth only)

## 📝 Notes
- Tech Stack: Next.js 14 + Supabase + Stripe + Tailwind CSS + DaisyUI
- Hosting: Vercel
- Domain: Namecheap (using Vercel DNS)
- Login URL: `/signin` (custom page, not NextAuth default)
