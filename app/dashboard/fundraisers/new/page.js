"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// New Fundraiser Form
export default function NewFundraiserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "event";

  const [isLoading, setIsLoading] = useState(false);
  const [fundCategories, setFundCategories] = useState(["General Fund"]);
  const [formData, setFormData] = useState({
    name: "",
    type: initialType,
    description: "",
    start_date: "",
    end_date: "",
    // Event-specific
    ticket_price: "",
    capacity: "",
    location: "",
    // Campaign-specific
    goal_amount: "",
    allow_recurring: false,
    show_donor_wall: false,
    send_tax_receipts: false,
    fund_allocation: [], // Array of { category: "Karate", percentage: 40 }
  });

  const fetchOrgCategories = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const data = await res.json();
        if (data.fund_categories && data.fund_categories.length > 0) {
          setFundCategories(data.fund_categories);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrgCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Allocation Handlers
  const addAllocation = () => {
    setFormData(prev => ({
      ...prev,
      fund_allocation: [...(prev.fund_allocation || []), { category: fundCategories[0], percentage: 0 }]
    }));
  };

  const updateAllocation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      fund_allocation: prev.fund_allocation.map((item, i) =>
        i === index ? { ...item, [field]: field === "percentage" ? parseInt(value) || 0 : value } : item
      )
    }));
  };

  const removeAllocation = (index) => {
    setFormData(prev => ({
      ...prev,
      fund_allocation: prev.fund_allocation.filter((_, i) => i !== index)
    }));
  };

  const getTotalAllocation = () => {
    return (formData.fund_allocation || []).reduce((sum, item) => sum + (item.percentage || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate end date is not before start date
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      toast.error("End date cannot be before start date");
      return;
    }

    // Validate allocation if present
    if (formData.fund_allocation && formData.fund_allocation.length > 0) {
      const total = getTotalAllocation();
      if (total !== 100) {
        toast.error(`Fund allocation must sum to 100%. Current total: ${total}%`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/fundraisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create fundraiser");
      }

      const data = await res.json();
      toast.success("Fundraiser created successfully!");
      router.push(`/dashboard/fundraisers/${data.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isEvent = formData.type === "event";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/fundraisers"
          className="btn btn-ghost btn-sm mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Fundraisers
        </Link>
        <h1 className="text-2xl font-bold">Create New Fundraiser</h1>
        <p className="text-base-content/70">
          Set up an event or donation campaign for your daycare
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fundraiser Type */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Fundraiser Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${isEvent
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-base-content/30"
                }`}
            >
              <input
                type="radio"
                name="type"
                value="event"
                checked={isEvent}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="text-3xl mb-2">🎟️</div>
              <div className="font-medium">Event</div>
              <div className="text-sm text-base-content/60">
                Sell tickets to galas, dinners, etc.
              </div>
            </label>
            <label
              className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${!isEvent
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-base-content/30"
                }`}
            >
              <input
                type="radio"
                name="type"
                value="donation_campaign"
                checked={!isEvent}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="text-3xl mb-2">💝</div>
              <div className="font-medium">Donation Campaign</div>
              <div className="text-sm text-base-content/60">
                Collect donations for a cause
              </div>
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {isEvent ? "Event Name" : "Campaign Name"} *
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={isEvent ? "Spring Gala 2026" : "New Playground Fund"}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={
                  isEvent
                    ? "Join us for an evening of dinner, drinks, and a live auction..."
                    : "Help us build a new playground for our kids..."
                }
                className="textarea textarea-bordered w-full h-24"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Date *</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fund Allocation */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Fund Allocation</h2>
              <p className="text-sm text-base-content/60">Where will the funds go?</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={addAllocation}
            >
              + Add Category
            </button>
          </div>

          {(formData.fund_allocation || []).length === 0 ? (
            <p className="text-sm text-base-content/50 italic">
              No specific allocation set (100% to General Fund by default if left empty).
            </p>
          ) : (
            <div className="space-y-3">
              {formData.fund_allocation.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    className="select select-bordered select-sm flex-1"
                    value={item.category}
                    onChange={(e) => updateAllocation(index, "category", e.target.value)}
                  >
                    {fundCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-20"
                    value={item.percentage}
                    onChange={(e) => updateAllocation(index, "percentage", e.target.value)}
                    min="1"
                    max="100"
                    placeholder="%"
                  />
                  <span className="text-sm font-medium">%</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => removeAllocation(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t mt-2">
                <span className={`text-sm font-bold ${getTotalAllocation() === 100 ? 'text-success' : 'text-error'}`}>
                  Total: {getTotalAllocation()}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Event-specific fields */}
        {isEvent && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Ticket Price *</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="text-base-content/60">$</span>
                    <input
                      type="number"
                      name="ticket_price"
                      value={formData.ticket_price}
                      onChange={handleChange}
                      placeholder="50"
                      min="0"
                      step="0.01"
                      className="grow"
                      required={isEvent}
                    />
                  </label>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Capacity</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="100"
                    min="1"
                    className="input input-bordered w-full"
                  />
                  <label className="label">
                    <span className="label-text-alt">Leave empty for unlimited</span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Location</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="123 Main St, City, State"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Campaign-specific fields */}
        {!isEvent && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Fundraising Goal</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <span className="text-base-content/60">$</span>
                  <input
                    type="number"
                    name="goal_amount"
                    value={formData.goal_amount}
                    onChange={handleChange}
                    placeholder="10000"
                    min="0"
                    step="0.01"
                    className="grow"
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt">
                    Leave empty for no goal (donations can continue indefinitely)
                  </span>
                </label>
              </div>

              <div className="divider">Options</div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="allow_recurring"
                    checked={formData.allow_recurring}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">
                      Allow recurring donations
                    </span>
                    <p className="text-sm text-base-content/60">
                      Let donors set up monthly contributions
                    </p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="show_donor_wall"
                    checked={formData.show_donor_wall}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">
                      Show donor wall
                    </span>
                    <p className="text-sm text-base-content/60">
                      Display donors publicly (they can opt out)
                    </p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    name="send_tax_receipts"
                    checked={formData.send_tax_receipts}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">
                      Send tax receipts
                    </span>
                    <p className="text-sm text-base-content/60">
                      Automatically email 501(c)(3) tax receipts
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-sm" />}
            {isLoading ? "Creating..." : "Create Fundraiser"}
          </button>
          <Link href="/dashboard/fundraisers" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
