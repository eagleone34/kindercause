# 🎁 KinderCause

Simple fundraising for daycares & preschools.

## Overview

KinderCause helps daycare centers manage their fundraising activities - from event ticketing to donation campaigns, all in one place.

### Features

- **Event Ticketing** - Sell tickets to galas, dinners, and parent nights
- **Donation Campaigns** - Run playground funds, scholarship drives, and more
- **Contact Management** - Organize your parent email lists
- **Email Campaigns** - Send announcements to parents
- **Payment Processing** - Secure payments via Stripe

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + DaisyUI
- Supabase (PostgreSQL)
- Stripe Payments
- NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/eagleone34/kindercause.git
cd kindercause

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

See `.env.example` for required environment variables.

## Deployment

This project is designed for deployment on Vercel:

```bash
npm run build
```

## License

MIT License - see LICENSE file for details.

## Contact

For questions or support, open an issue on GitHub.
