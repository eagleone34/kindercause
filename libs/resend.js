import { Resend } from "resend";
import config from "@/config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using the provided parameters.
 *
 * @async
 * @param {Object} params - The parameters for sending the email.
 * @param {string | string[]} params.to - The recipient's email address or an array of email addresses.
 * @param {string} params.subject - The subject of the email.
 * @param {string} params.text - The plain text content of the email.
 * @param {string} params.html - The HTML content of the email.
 * @param {string} [params.replyTo] - The email address to set as the "Reply-To" address.
 * @returns {Promise<Object>} A Promise that resolves with the email sending result data.
 */
export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  const { data, error } = await resend.emails.send({
    from: config.resend.fromAdmin,
    to,
    subject,
    text,
    html,
    ...(replyTo && { replyTo }),
  });

  if (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }

  return data;
};

/**
 * Sends a welcome email to a new subscriber.
 *
 * @async
 * @param {Object} params - The parameters for sending the welcome email.
 * @param {string} params.to - The recipient's email address.
 * @param {string} params.customerName - The customer's name.
 * @param {string} params.planName - The name of the subscribed plan.
 * @returns {Promise<Object>} A Promise that resolves with the email sending result data.
 */
export const sendWelcomeEmail = async ({ to, customerName, planName }) => {
  const firstName = customerName?.split(' ')[0] || 'there';
  const signInUrl = `https://${config.domainName}/signin`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">🎉 Welcome to KinderCause!</h1>
      </div>
      
      <p>Hi ${firstName},</p>
      
      <p>Thank you for subscribing to the <strong>${planName || 'KinderCause'}</strong> plan! We're thrilled to have you on board.</p>
      
      <p>With your subscription, you can now:</p>
      <ul style="padding-left: 20px;">
        <li>Create unlimited events and fundraising campaigns</li>
        <li>Manage your contacts and donors</li>
        <li>Send email notifications to parents</li>
        <li>Generate QR code tickets for events</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${signInUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Sign In to Your Dashboard</a>
      </div>
      
      <p>If you have any questions, just reply to this email — we're always happy to help!</p>
      
      <p style="margin-top: 30px;">
        Cheers,<br>
        <strong>The KinderCause Team</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #888; text-align: center;">
        You're receiving this email because you signed up for KinderCause.<br>
        © ${new Date().getFullYear()} KinderCause. All rights reserved.
      </p>
    </body>
    </html>
  `;

  const text = `
Welcome to KinderCause, ${firstName}!

Thank you for subscribing to the ${planName || 'KinderCause'} plan.

Sign in to your dashboard: ${signInUrl}

If you have any questions, just reply to this email.

— The KinderCause Team
  `.trim();

  return sendEmail({
    to,
    subject: `Welcome to KinderCause! 🎉`,
    text,
    html,
    replyTo: config.resend.supportEmail,
  });
};
