"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewEmailCampaignPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    selectedTags: [],
  });
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    // Calculate recipient count based on selected tags
    if (formData.selectedTags.length === 0) {
      setRecipientCount(contacts.length);
    } else {
      const filtered = contacts.filter((c) =>
        formData.selectedTags.some((tag) => c.tags?.includes(tag))
      );
      setRecipientCount(filtered.length);
    }
  }, [formData.selectedTags, contacts]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
        // Extract unique tags
        const tags = new Set();
        data.contacts.forEach((c) => c.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      toast.error("Failed to load contacts");
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

  const handleSaveDraft = async () => {
    if (!formData.subject) {
      toast.error("Subject is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "draft",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save draft");
      }

      toast.success("Draft saved");
      router.push("/dashboard/emails");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.body) {
      toast.error("Subject and message are required");
      return;
    }

    if (recipientCount === 0) {
      toast.error("No recipients selected");
      return;
    }

    if (!confirm(`Send email to ${recipientCount} contacts?`)) {
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          recipientCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success(`Email sent to ${data.sent} contacts!`);
      router.push("/dashboard/emails");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

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
        <h1 className="text-2xl font-bold">New Email Campaign</h1>
        <p className="text-base-content/70">
          Compose and send an email to your contacts
        </p>
      </div>

      <div className="space-y-6">
        {/* Recipients */}
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
                <span className="label-text-alt">Optional</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`badge badge-lg cursor-pointer ${
                      formData.selectedTags.includes(tag)
                        ? "badge-primary"
                        : "badge-outline"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {formData.selectedTags.includes(tag) && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>
                No contacts found.{" "}
                <Link href="/dashboard/contacts/import" className="link">
                  Import contacts first
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Email Content</h2>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Subject Line *</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Spring Gala Tickets Now Available!"
                className="input input-bordered w-full"
                maxLength={100}
              />
              <label className="label">
                <span className="label-text-alt">
                  {formData.subject.length}/100 characters
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Message *</span>
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Write your message here...

Tips:
- Start with a friendly greeting
- Get to the point quickly
- Include a clear call-to-action
- Add a link to your fundraiser"
                className="textarea textarea-bordered w-full h-64 font-mono text-sm"
              />
              <label className="label">
                <span className="label-text-alt">
                  Plain text only. Links will be clickable.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        {(formData.subject || formData.body) && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Preview</h2>
            <div className="border border-base-300 rounded-lg p-4 bg-white">
              <div className="border-b border-base-200 pb-3 mb-3">
                <p className="text-sm text-base-content/60">Subject:</p>
                <p className="font-medium">
                  {formData.subject || "(No subject)"}
                </p>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {formData.body || "(No message)"}
              </div>
              <div className="mt-6 pt-4 border-t border-base-200 text-xs text-base-content/50">
                <p>—</p>
                <p>Sent via KinderCause</p>
                <p className="mt-2">
                  <a href="#" className="link">Unsubscribe</a> from future emails
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn btn-primary flex-1"
            onClick={handleSend}
            disabled={isSending || recipientCount === 0}
          >
            {isSending ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Sending...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                Send to {recipientCount} contacts
              </>
            )}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Save Draft"
            )}
          </button>
          <Link href="/dashboard/emails" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
