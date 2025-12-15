const config = {
  // REQUIRED
  appName: "KinderCause",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Simple fundraising for daycares. Event ticketing, donation campaigns, and contact management - all in one place.",
  // REQUIRED (no https://, not trailing slash at the end, just the naked domain)
  domainName: "kindercause.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.STRIPE_STARTER_PRICE_ID || "price_starter_placeholder",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for small daycares running 2-4 fundraisers/year",
        // The price you want to display, the one user will be charged on Stripe.
        price: 29,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 49,
        features: [
          { name: "Unlimited events & campaigns" },
          { name: "Contact management" },
          { name: "Email notifications" },
          { name: "QR code tickets" },
          { name: "3% transaction fee" },
        ],
      },
      {
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        priceId:
          process.env.STRIPE_GROWTH_PRICE_ID || "price_growth_placeholder",
        name: "Growth",
        description: "For growing daycares with more frequent fundraising",
        price: 79,
        priceAnchor: 99,
        features: [
          { name: "Everything in Starter" },
          { name: "Volunteer shift management" },
          { name: "Analytics dashboard" },
          { name: "Email campaigns" },
          { name: "2% transaction fee" },
        ],
      },
    ],
    // Platform fee percentage (3% for Starter)
    platformFeePercent: 3,
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `KinderCause <noreply@kindercause.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `KinderCause <hello@kindercause.com>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "hello@kindercause.com",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#10b981", // Emerald green for growth/fundraising
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
};

export default config;
