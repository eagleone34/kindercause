"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: "badge-ghost",
      scheduled: "badge-warning",
      sending: "badge-info",
      sent: "badge-success",
      failed: "badge-error",
    };
    return styles[status] || "badge-ghost";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="text-base-content/70">
            Send announcements and updates to your contacts
          </p>
        </div>
        <Link href="/dashboard/emails/new" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Campaigns List */}
      <div className="bg-base-100 rounded-box shadow">
        {isLoading ? (
          <div className="p-12 text-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h3 className="font-semibold mb-2">No campaigns yet</h3>
            <p className="text-base-content/60 mb-4">
              Create your first email campaign to reach your contacts
            </p>
            <Link href="/dashboard/emails/new" className="btn btn-primary btn-sm">
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Sent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover">
                    <td>
                      <div className="font-medium">{campaign.subject}</div>
                      <div className="text-sm text-base-content/60">
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td>{campaign.recipient_count || "—"}</td>
                    <td>
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {campaign.status === "draft" && (
                          <Link
                            href={`/dashboard/emails/${campaign.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Edit
                          </Link>
                        )}
                        {campaign.status === "sent" && (
                          <Link
                            href={`/dashboard/emails/${campaign.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-base-200 rounded-box p-6">
        <h3 className="font-medium mb-3">📧 Email Best Practices</h3>
        <ul className="text-sm text-base-content/70 space-y-2">
          <li>• Keep subject lines under 50 characters for better open rates</li>
          <li>• Personalize when possible - mention your daycare name</li>
          <li>• Include a clear call-to-action (link to fundraiser, RSVP, etc.)</li>
          <li>• Test emails by sending to yourself first</li>
        </ul>
      </div>
    </div>
  );
}
