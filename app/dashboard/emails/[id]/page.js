"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EmailCampaignDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    selectedTags: [],
  });
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    fetchCampaign();
    fetchContacts();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (formData.selectedTags.length === 0) {
      setRecipientCount(contacts.length);
    } else {
      const filtered = contacts.filter((c) =>
        formData.selectedTags.some((tag) => c.tags?.includes(tag))
      );
      setRecipientCount(filtered.length);
    }
  }, [formData.selectedTags, contacts]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/emails/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Campaign not found");
          router.push("/dashboard/emails");
          return;
        }
        throw new Error("Failed to fetch campaign");
      }
      const data = await res.json();
      setCampaign(data.campaign);
      setFormData({
        subject: data.campaign.subject || "",
        body: data.campaign.body || "",
        selectedTags: data.campaign.filter_tags || [],
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
        const tags = new Set();
        data.contacts.forEach((c) => c.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const handleSave = async () => {
    if (!formData.subject) {
      toast.error("Subject is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast.success("Changes saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete campaign");
      }

      toast.success("Campaign deleted");
      router.push("/dashboard/emails");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const isDraft = campaign.status === "draft";
  const isSent = campaign.status === "sent";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/emails" className="btn btn-ghost btn-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Emails
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isDraft ? "Edit Campaign" : "Campaign Details"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${campaign.status === "draft" ? "badge-ghost" :
                campaign.status === "sent" ? "badge-success" :
                  "badge-info"
                }`}>
                {campaign.status}
              </span>
              <span className="text-base-content/60 text-sm">
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {isDraft && (
            <button className="btn btn-ghost btn-sm text-error" onClick={handleDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Sent Campaign Summary */}
      {isSent && (
        <div className="bg-success/10 border border-success/20 rounded-box p-6 mb-6">
          <h3 className="font-semibold text-success mb-3">✓ Campaign Sent</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-base-content/60">Sent at:</span>
              <p className="font-medium">{new Date(campaign.sent_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-base-content/60">Recipients:</span>
              <p className="font-medium">{campaign.recipient_count} contacts</p>
            </div>
            {campaign.sent_count !== undefined && (
              <div>
                <span className="text-base-content/60">Successfully sent:</span>
                <p className="font-medium">{campaign.sent_count} emails</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Recipients - only show for drafts */}
        {isDraft && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Recipients</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="badge badge-lg badge-primary">
                {recipientCount} contacts
              </div>
              <span className="text-sm text-base-content/60">
                {formData.selectedTags.length === 0
                  ? "All contacts"
                  : `Filtered by ${formData.selectedTags.length} tag(s)`}
              </span>
            </div>

            {allTags.length > 0 && (
              <div>
                <label className="label">
                  <span className="label-text font-medium">Filter by tags</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`badge badge-lg cursor-pointer ${formData.selectedTags.includes(tag)
                        ? "badge-primary"
                        : "badge-outline"
                        }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Content */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Email Content</h2>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Subject Line</span>
              </label>
              {isDraft ? (
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g., Spring Gala Tickets Now Available!"
                  className="input input-bordered w-full"
                  maxLength={100}
                />
              ) : (
                <p className="py-2 font-medium">{campaign.subject}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Message</span>
              </label>
              {isDraft ? (
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                />
              ) : (
                <div className="whitespace-pre-wrap bg-base-200 rounded-lg p-4 text-sm">
                  {campaign.body}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - only for drafts */}
        {isDraft && (
          <div className="flex gap-3">
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Save Changes"
              )}
            </button>
            <Link href="/dashboard/emails" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
