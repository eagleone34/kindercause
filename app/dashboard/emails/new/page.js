"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { EMAIL_TEMPLATES, TEMPLATE_CATEGORIES, SMART_VARIABLES } from "@/libs/emailTemplates";

export default function NewEmailCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [fundraisers, setFundraisers] = useState([]); // All fundraisers for dropdown
  const [fundraiser, setFundraiser] = useState(null); // Selected fundraiser
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true); // Show template picker initially
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    selectedGroups: [],
    selectedContacts: [],
  });
  const [recipientCount, setRecipientCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    fetchContacts();
    fetchGroups();
    fetchOrganization();
    fetchFundraisers();

    // Check for fundraiser query param
    const fundraiserId = searchParams.get("fundraiser");
    if (fundraiserId) {
      fetchFundraiser(fundraiserId);
    }
  }, []);

  // Calculate recipient count
  useEffect(() => {
    let recipients = new Set();

    if (formData.selectedGroups.length > 0) {
      contacts.forEach((c) => {
        if (formData.selectedGroups.some((g) => c.tags?.includes(g))) {
          recipients.add(c.id);
        }
      });
    }

    formData.selectedContacts.forEach((c) => recipients.add(c.id));

    if (formData.selectedGroups.length === 0 && formData.selectedContacts.length === 0) {
      setRecipientCount(contacts.length);
    } else {
      setRecipientCount(recipients.size);
    }
  }, [formData.selectedGroups, formData.selectedContacts, contacts]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch contacts");
      if (data.contacts) setContacts(data.contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error(error.message || "Failed to load contacts");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (data.groups) setGroups(data.groups);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrganization = async () => {
    try {
      const res = await fetch("/api/organization");
      const data = await res.json();
      if (res.ok) setOrganization(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFundraisers = async () => {
    try {
      const res = await fetch("/api/fundraisers");
      const data = await res.json();
      if (res.ok && data.fundraisers) {
        // Filter to only active fundraisers
        setFundraisers(data.fundraisers.filter(f => f.status === "active"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFundraiser = async (id) => {
    try {
      const res = await fetch(`/api/fundraisers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFundraiser(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectFundraiser = (id) => {
    if (!id) {
      setFundraiser(null);
      return;
    }
    fetchFundraiser(id);
  };

  // Replace smart variables in text
  const replaceVariables = (text, forPreview = false) => {
    if (!text) return text;

    let result = text;

    // Organization variables
    if (organization) {
      result = result.replace(/\{\{organization_name\}\}/g, organization.name || "");
    }

    // For preview, show first_name as example
    if (forPreview) {
      result = result.replace(/\{\{first_name\}\}/g, "Sarah");
    }

    // Fundraiser/Event variables
    if (fundraiser) {
      result = result.replace(/\{\{event_name\}\}/g, fundraiser.name || "");
      result = result.replace(/\{\{event_start_date\}\}/g,
        fundraiser.start_date ? new Date(fundraiser.start_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : ""
      );
      result = result.replace(/\{\{event_end_date\}\}/g,
        fundraiser.end_date ? new Date(fundraiser.end_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : ""
      );
      // Legacy support for {{event_date}}
      result = result.replace(/\{\{event_date\}\}/g,
        fundraiser.start_date ? new Date(fundraiser.start_date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : ""
      );
      result = result.replace(/\{\{event_location\}\}/g, fundraiser.location || "TBD");
      result = result.replace(/\{\{ticket_price\}\}/g, fundraiser.ticket_price || "");

      const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${fundraiser.organization?.slug}/${fundraiser.slug}`;
      result = result.replace(/\{\{purchase_link\}\}/g, publicUrl);
      result = result.replace(/\{\{donate_link\}\}/g, publicUrl);
    }

    return result;
  };

  const selectTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      subject: replaceVariables(template.subject),
      body: replaceVariables(template.body),
    }));
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied!`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGroup = (group) => {
    setFormData((prev) => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(group)
        ? prev.selectedGroups.filter((g) => g !== group)
        : [...prev.selectedGroups, group],
    }));
  };

  const addContact = (contact) => {
    if (!formData.selectedContacts.find((c) => c.id === contact.id)) {
      setFormData((prev) => ({
        ...prev,
        selectedContacts: [...prev.selectedContacts, contact],
      }));
    }
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const removeContact = (contactId) => {
    setFormData((prev) => ({
      ...prev,
      selectedContacts: prev.selectedContacts.filter((c) => c.id !== contactId),
    }));
  };

  const filteredSuggestions = contacts.filter((c) => {
    const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matches = name.includes(term) || c.email.toLowerCase().includes(term);
    const notAlreadySelected = !formData.selectedContacts.find((sc) => sc.id === c.id);
    return matches && notAlreadySelected && term.length > 0;
  }).slice(0, 5);

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
          subject: formData.subject,
          body: formData.body,
          selectedTags: formData.selectedGroups,
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
          subject: formData.subject,
          body: formData.body,
          selectedTags: formData.selectedGroups,
          selectedContactIds: formData.selectedContacts.map((c) => c.id),
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
          {fundraiser
            ? `Compose email for ${fundraiser.name}`
            : "Compose and send an email to your contacts"
          }
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Picker */}
        {showTemplates && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">✨ Start with a Template</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTemplates(false)}
              >
                Start from Scratch
              </button>
            </div>

            <div className="space-y-6">
              {TEMPLATE_CATEGORIES.map((category) => (
                <div key={category.id}>
                  <h3 className="text-sm font-medium text-base-content/70 mb-3">
                    {category.emoji} {category.name}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EMAIL_TEMPLATES.filter(t => t.category === category.id).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => selectTemplate(template)}
                        className="flex flex-col items-start p-4 border border-base-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                      >
                        <span className="text-2xl mb-2">{template.emoji}</span>
                        <span className="font-medium text-sm">{template.name}</span>
                        <span className="text-xs text-base-content/60 mt-1">
                          {template.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipients */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Recipients</h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="badge badge-lg badge-primary">
              {recipientCount} contacts
            </div>
            <span className="text-sm text-base-content/60">
              {formData.selectedGroups.length === 0 && formData.selectedContacts.length === 0
                ? "All contacts"
                : `${formData.selectedGroups.length} group(s), ${formData.selectedContacts.length} individual(s)`}
            </span>
          </div>

          {/* Event/Campaign Selector */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">🎟️ Link to Event/Campaign</span>
              <span className="label-text-alt">For event variables in templates</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={fundraiser?.id || ""}
              onChange={(e) => handleSelectFundraiser(e.target.value)}
            >
              <option value="">No event selected (use generic templates)</option>
              {fundraisers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.type === "event" ? "🎟️" : "💝"} {f.name}
                  {f.start_date && ` • ${new Date(f.start_date).toLocaleDateString()}`}
                </option>
              ))}
            </select>
            {fundraiser && (
              <label className="label">
                <span className="label-text-alt text-success">
                  ✓ Variables like {"{{event_name}}"}, {"{{event_date}}"}, {"{{ticket_price}}"} will be auto-filled
                </span>
              </label>
            )}
          </div>

          {/* Selected Event Info */}
          {fundraiser && (
            <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{fundraiser.type === "event" ? "🎟️" : "💝"}</span>
                <div className="flex-1">
                  <div className="font-medium">{fundraiser.name}</div>
                  <div className="text-sm text-base-content/70 space-y-1 mt-1">
                    {fundraiser.start_date && (
                      <div>📅 {new Date(fundraiser.start_date).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}</div>
                    )}
                    {fundraiser.location && <div>📍 {fundraiser.location}</div>}
                    {fundraiser.ticket_price && <div>🎟️ ${fundraiser.ticket_price}</div>}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setFundraiser(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Search for contacts */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Search Contacts</span>
            </label>
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type a name or email..."
                className="input input-bordered w-full"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-box shadow-lg max-h-48 overflow-auto">
                  {filteredSuggestions.map((c) => (
                    <li
                      key={c.id}
                      className="px-4 py-2 hover:bg-base-200 cursor-pointer"
                      onClick={() => addContact(c)}
                    >
                      <div className="font-medium">
                        {c.first_name} {c.last_name}
                      </div>
                      <div className="text-sm text-base-content/60">{c.email}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Selected individual contacts */}
          {formData.selectedContacts.length > 0 && (
            <div className="mb-4">
              <label className="label">
                <span className="label-text font-medium">Selected Contacts</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.selectedContacts.map((c) => (
                  <div key={c.id} className="badge badge-lg gap-1">
                    {c.first_name} {c.last_name}
                    <button onClick={() => removeContact(c.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter by groups */}
          {groups.length > 0 && (
            <div>
              <label className="label">
                <span className="label-text font-medium">Select Groups</span>
                <span className="label-text-alt">Send to all contacts in these groups</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <button
                    key={group}
                    className={`badge badge-lg cursor-pointer ${formData.selectedGroups.includes(group)
                      ? "badge-primary"
                      : "badge-outline"
                      }`}
                    onClick={() => toggleGroup(group)}
                  >
                    {group}
                    {formData.selectedGroups.includes(group) && (
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
            <div className="alert alert-warning mt-4">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Email Content</h2>
            {!showTemplates && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTemplates(true)}
              >
                📄 Use Template
              </button>
            )}
          </div>

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
                placeholder="Write your message here..."
                className="textarea textarea-bordered w-full h-64 font-mono text-sm"
              />
              <label className="label">
                <span className="label-text-alt">
                  Plain text only. Links will be clickable. Use {"{{first_name}}"} for personalization.
                </span>
              </label>
            </div>

            {/* Variable Helper */}
            <div className="collapse collapse-arrow bg-base-200 rounded-lg">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                📝 Available Variables (click to copy)
              </div>
              <div className="collapse-content">
                <div className="space-y-3 pt-2">
                  {/* Always available variables */}
                  <div>
                    <p className="text-xs text-base-content/60 mb-2">Always available:</p>
                    <div className="flex flex-wrap gap-2">
                      {SMART_VARIABLES.filter(v => !v.requiresEvent).map((v) => (
                        <button
                          key={v.variable}
                          className="badge badge-outline cursor-pointer hover:badge-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(v.variable);
                            toast.success(`Copied ${v.variable}`);
                          }}
                          title={v.description}
                        >
                          {v.variable}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event variables */}
                  <div>
                    <p className="text-xs text-base-content/60 mb-2">
                      Event variables {!fundraiser && <span className="text-warning">(select an event above to use these)</span>}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SMART_VARIABLES.filter(v => v.requiresEvent).map((v) => (
                        <button
                          key={v.variable}
                          className={`badge cursor-pointer ${fundraiser
                              ? "badge-outline hover:badge-primary"
                              : "badge-ghost opacity-50 cursor-not-allowed"
                            }`}
                          onClick={() => {
                            if (!fundraiser) {
                              toast.error("Select an event first to use this variable");
                              return;
                            }
                            navigator.clipboard.writeText(v.variable);
                            toast.success(`Copied ${v.variable}`);
                          }}
                          title={fundraiser ? v.description : "Select an event first"}
                        >
                          {v.variable}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {(formData.subject || formData.body) && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">📧 Preview</h2>
            <p className="text-sm text-base-content/60 mb-3">
              This is how your email will look. Variables are replaced with actual values.
            </p>
            <div className="border border-base-300 rounded-lg p-4 bg-white">
              <div className="border-b border-base-200 pb-3 mb-3">
                <p className="text-sm text-base-content/60">Subject:</p>
                <p className="font-medium">{replaceVariables(formData.subject, true) || "(No subject)"}</p>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {replaceVariables(formData.body, true) || "(No message)"}
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
