"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditFundraiserPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fundCategories, setFundCategories] = useState(["General Fund"]);
    const [formData, setFormData] = useState({
        name: "",
        type: "event",
        description: "",
        start_date: "",
        end_date: "",
        ticket_price: "",
        capacity: "",
        location: "",
        goal_amount: "",
        allow_recurring: false,
        show_donor_wall: false,
        send_tax_receipts: false,
        fund_allocation: [], // Array of { category: "Karate", percentage: 40 }
    });

    useEffect(() => {
        fetchOrgCategories();
        fetchFundraiser();
    }, [params.id]);

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

    const fetchFundraiser = async () => {
        try {
            const res = await fetch(`/api/fundraisers/${params.id}`);
            if (!res.ok) {
                toast.error("Fundraiser not found");
                router.push("/dashboard/fundraisers");
                return;
            }
            const data = await res.json();
            setFormData({
                name: data.name || "",
                type: data.type || "event",
                description: data.description || "",
                start_date: data.start_date ? data.start_date.split("T")[0] : "",
                end_date: data.end_date ? data.end_date.split("T")[0] : "",
                ticket_price: data.ticket_price || "",
                capacity: data.capacity || "",
                location: data.location || "",
                goal_amount: data.goal_amount || "",
                allow_recurring: data.allow_recurring || false,
                show_donor_wall: data.show_donor_wall || false,
                send_tax_receipts: data.send_tax_receipts || false,
                fund_allocation: data.fund_allocation || [],
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load fundraiser");
        } finally {
            setIsLoading(false);
        }
    };

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

        setIsSaving(true);

        try {
            const res = await fetch(`/api/fundraisers/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update fundraiser");
            }

            toast.success("Fundraiser updated!");
            router.push(`/dashboard/fundraisers/${params.id}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    const isEvent = formData.type === "event";

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/dashboard/fundraisers/${params.id}`}
                    className="btn btn-ghost btn-sm mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </Link>
                <h1 className="text-2xl font-bold">Edit Fundraiser</h1>
                <p className="text-base-content/70">
                    Update your {isEvent ? "event" : "campaign"} details
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-base-100 rounded-box shadow p-6">
                    <h2 className="font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Name *</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Spring Gala Dinner"
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
                                placeholder="Tell parents about this fundraiser..."
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
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="ticket_price"
                                            value={formData.ticket_price}
                                            onChange={handleChange}
                                            placeholder="50"
                                            className="grow"
                                            min="0"
                                            step="0.01"
                                            required
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
                                        className="input input-bordered w-full"
                                        min="1"
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
                                    placeholder="Community Center, 123 Main St"
                                    className="input input-bordered w-full"
                                    maxLength={35}
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
                                    <span className="label-text font-medium">Goal Amount</span>
                                </label>
                                <label className="input input-bordered flex items-center gap-2">
                                    <span>$</span>
                                    <input
                                        type="number"
                                        name="goal_amount"
                                        value={formData.goal_amount}
                                        onChange={handleChange}
                                        placeholder="5000"
                                        className="grow"
                                        min="0"
                                    />
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        name="allow_recurring"
                                        checked={formData.allow_recurring}
                                        onChange={handleChange}
                                        className="checkbox checkbox-primary"
                                    />
                                    <span className="label-text">Allow recurring donations</span>
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
                                    <span className="label-text">Show donor wall</span>
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
                        disabled={isSaving}
                    >
                        {isSaving && <span className="loading loading-spinner loading-sm" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <Link href={`/dashboard/fundraisers/${params.id}`} className="btn btn-ghost">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
