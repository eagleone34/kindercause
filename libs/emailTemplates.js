// Email templates with smart variables
// Variables: {{first_name}}, {{organization_name}}, {{event_name}}, {{event_date}}, 
//            {{event_location}}, {{ticket_price}}, {{purchase_link}}, {{donate_link}}

export const EMAIL_TEMPLATES = [
    // Event Templates
    {
        id: "event_announcement",
        name: "Event Announcement",
        category: "event",
        emoji: "🎟️",
        description: "Announce a new event to your contacts",
        subject: "You're Invited: {{event_name}}!",
        body: `Hi {{first_name}},

We're excited to invite you to {{event_name}}!

📅 Date: {{event_date}}
📍 Location: {{event_location}}
🎟️ Tickets: ${{ ticket_price }}

This is going to be a wonderful event for our community, and we'd love to see you there.

Get your tickets here: {{purchase_link}}

Looking forward to seeing you!

Warm regards,
{{organization_name}}`,
    },
    {
        id: "event_reminder",
        name: "Event Reminder",
        category: "event",
        emoji: "⏰",
        description: "Remind attendees about an upcoming event",
        subject: "Reminder: {{event_name}} is Coming Up!",
        body: `Hi {{first_name}},

Just a friendly reminder that {{event_name}} is coming up soon!

📅 Date: {{event_date}}
📍 Location: {{event_location}}

We can't wait to see you there. If you haven't gotten your tickets yet, there's still time:
{{purchase_link}}

See you soon!

{{organization_name}}`,
    },
    {
        id: "post_event_thankyou",
        name: "Post-Event Thank You",
        category: "event",
        emoji: "🙏",
        description: "Thank attendees after an event",
        subject: "Thank You for Attending {{event_name}}!",
        body: `Hi {{first_name}},

Thank you so much for joining us at {{event_name}}! We hope you had a wonderful time.

Your support means the world to our community. Together, we're making a real difference for our children.

We'd love to hear your feedback! Simply reply to this email with any thoughts or suggestions.

Until next time,
{{organization_name}}`,
    },

    // Fundraising Templates
    {
        id: "donation_request",
        name: "Donation Request",
        category: "fundraising",
        emoji: "💝",
        description: "Ask for support for your campaign",
        subject: "Help Us Reach Our Goal: {{event_name}}",
        body: `Hi {{first_name}},

We're reaching out to ask for your support with {{event_name}}.

Every donation, no matter the size, makes a meaningful difference for our children. Your generosity helps us provide enriching experiences and resources that might otherwise be out of reach.

Donate today: {{donate_link}}

Thank you for being part of our community!

With gratitude,
{{organization_name}}`,
    },
    {
        id: "donation_thankyou",
        name: "Donation Thank You",
        category: "fundraising",
        emoji: "❤️",
        description: "Thank donors for their contribution",
        subject: "Thank You for Your Generous Donation!",
        body: `Hi {{first_name}},

We're incredibly grateful for your generous donation to {{event_name}}!

Your support directly impacts the children in our community. Thanks to donors like you, we can continue to provide amazing experiences and opportunities.

We'll keep you updated on how your donation is making a difference.

From the bottom of our hearts, thank you!

{{organization_name}}`,
    },

    // General Templates
    {
        id: "newsletter",
        name: "Monthly Newsletter",
        category: "general",
        emoji: "📧",
        description: "Monthly update for your community",
        subject: "{{organization_name}} Monthly Update",
        body: `Hi {{first_name}},

Here's what's happening at {{organization_name}}!

📰 UPDATES
- [Share recent news or achievements]
- [Highlight a success story]

📅 UPCOMING EVENTS
- [List upcoming events with dates]

🙏 THANK YOU
Thank you for being part of our community. Your support makes everything we do possible.

Best wishes,
{{organization_name}}`,
    },
    {
        id: "welcome",
        name: "Welcome New Family",
        category: "general",
        emoji: "👋",
        description: "Welcome new families to your community",
        subject: "Welcome to {{organization_name}}!",
        body: `Hi {{first_name}},

Welcome to the {{organization_name}} family! We're so excited to have you join our community.

Here's what you can expect:
• Regular updates on events and activities
• Opportunities to get involved
• A supportive community of families

If you have any questions, just reply to this email – we're always happy to help!

Looking forward to an amazing journey together,
{{organization_name}}`,
    },
];

export const TEMPLATE_CATEGORIES = [
    { id: "event", name: "Event Templates", emoji: "🎟️" },
    { id: "fundraising", name: "Fundraising", emoji: "💝" },
    { id: "general", name: "General", emoji: "📧" },
];

// Smart variables that can be auto-replaced
export const SMART_VARIABLES = [
    { variable: "{{first_name}}", description: "Recipient's first name", example: "Sarah" },
    { variable: "{{organization_name}}", description: "Your organization name", example: "Sunshine Daycare" },
    { variable: "{{event_name}}", description: "Event or campaign name", example: "Spring Gala 2024" },
    { variable: "{{event_date}}", description: "Event date", example: "March 15, 2024" },
    { variable: "{{event_location}}", description: "Event location", example: "Community Center" },
    { variable: "{{ticket_price}}", description: "Ticket price", example: "25" },
    { variable: "{{purchase_link}}", description: "Link to purchase tickets", example: "https://..." },
    { variable: "{{donate_link}}", description: "Link to donate", example: "https://..." },
];
