"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import apiClient from "@/libs/api";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zip: "",
    });

    useEffect(() => {
        fetchOrganization();
        fetchGroups();
    }, []);

    const fetchOrganization = async () => {
        try {
            const res = await fetch("/api/organization");
            if (res.ok) {
                const data = await res.json();
                setOrganization(data);
                setFormData({
                    name: data.name || "",
                    phone: data.phone || "",
                    website: data.website || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    zip: data.zip || "",
                    fund_categories: data.fund_categories && data.fund_categories.length > 0 ? data.fund_categories : ["General Fund"],
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Group name is required");
            return;
        }

        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add group");
            }

            toast.success("Group added!");
            setNewGroupName("");
            fetchGroups();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteGroup = async (groupName) => {
        try {
            const res = await fetch(`/api/groups?name=${encodeURIComponent(groupName)}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete group");
            }

            toast.success("Group deleted!");
            fetchGroups();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name?.trim()) {
            toast.error("Organization name is required");
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch("/api/organization", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save settings");
            }

            toast.success("Settings saved!");
            fetchOrganization();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBilling = async () => {
        try {
            const { url } = await apiClient.post("/stripe/create-portal", {
                returnUrl: window.location.href,
            });
            window.location.href = url;
        } catch (e) {
            // apiClient already shows toast errors automatically
            console.error(e);

            // If user has no billing account (no execution of checkout yet), redirect to pricing
            if (e.message?.includes("You don't have a billing account yet")) {
                toast("Redirecting to subscription plans...", { icon: "💳" });
                setTimeout(() => {
                    window.location.href = "/#pricing";
                }, 1500);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Organization Settings */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Organization Details</h2>

                    <div className="grid gap-6 max-w-xl">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Organization Name</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="My Daycare Center"
                                className="input input-bordered w-full"
                            />
                        </div>


                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Phone Number</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(555) 123-4567"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Website</span>
                            </label>
                            <input
                                type="text"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://www.example.com"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Public URL</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-base-content/60">kindercause.com/</span>
                                <span className="font-medium text-primary">{organization?.slug || ""}</span>
                            </div>
                            <label className="label">
                                <span className="label-text-alt">This is your organization&apos;s public page URL</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Address</h2>

                    <div className="grid gap-6 max-w-xl">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Street Address</span>
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Main St"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="form-control col-span-1">
                                <label className="label">
                                    <span className="label-text font-medium">City</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="input input-bordered w-full"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">State</span>
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="CA"
                                    className="input input-bordered w-full"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">ZIP</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    placeholder="12345"
                                    className="input input-bordered w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Groups */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Contact Groups</h2>
                    <p className="text-base-content/60 mb-4">
                        Organize your contacts into groups for targeted email campaigns.
                    </p>

                    {/* All Groups */}
                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Your Groups</h3>
                        {groups.length === 0 ? (
                            <p className="text-base-content/50 text-sm">No groups yet. Add one below!</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {groups.map((group) => (
                                    <span key={group} className="badge badge-lg gap-1">
                                        {group}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGroup(group)}
                                            className="hover:text-error"
                                            title="Delete group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add New Group */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Add New Group</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Enter group name..."
                                className="input input-bordered flex-1"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddGroup())}
                            />
                            <button
                                type="button"
                                onClick={handleAddGroup}
                                className="btn btn-primary"
                            >
                                Add Group
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fund Categories */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Fund Allocation Categories</h2>
                    <p className="text-base-content/60 mb-4">
                        Define categories to allocate proceeds from your events (e.g., General Fund, Karate Class, Dance Class).
                    </p>

                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Your Categories</h3>
                        {(!formData.fund_categories || formData.fund_categories.length === 0) ? (
                            <p className="text-base-content/50 text-sm">No categories defined yet. Add one below!</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {formData.fund_categories.map((category, index) => (
                                    <span key={index} className="badge badge-lg gap-1 badge-outline">
                                        {category}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newCategories = formData.fund_categories.filter((_, i) => i !== index);
                                                setFormData(prev => ({ ...prev, fund_categories: newCategories }));
                                            }}
                                            className="hover:text-error"
                                            title="Delete category"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Add New Category</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="newCategoryInput"
                                placeholder="Enter category name..."
                                className="input input-bordered flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        const val = e.target.value.trim();
                                        if (val) {
                                            setFormData(prev => ({
                                                ...prev,
                                                fund_categories: [...(prev.fund_categories || []), val]
                                            }));
                                            e.target.value = "";
                                        }
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.getElementById("newCategoryInput");
                                    const val = input.value.trim();
                                    if (val) {
                                        setFormData(prev => ({
                                            ...prev,
                                            fund_categories: [...(prev.fund_categories || []), val]
                                        }));
                                        input.value = "";
                                    }
                                }}
                                className="btn btn-primary"
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payouts & Banking */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Payouts & Banking</h2>
                    <p className="text-base-content/60 mb-6">
                        Connect your bank account to receive payouts from your fundraisers.
                    </p>

                    <div className="flex items-center gap-4">
                        {organization?.stripe_account_id ? (
                            <div className="w-full">
                                <div className="alert alert-success mb-4 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>Your bank account is connected.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const res = await fetch("/api/stripe/dashboard", { method: "POST" });
                                            const data = await res.json();
                                            if (data.url) window.location.href = data.url;
                                            else toast.error("Failed to load dashboard");
                                        } catch (e) { toast.error("Error loading dashboard"); }
                                    }}
                                    className="btn btn-primary"
                                >
                                    View Payout Dashboard
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        toast("Connecting to Stripe...", { icon: "🏦" });
                                        try {
                                            const res = await fetch("/api/stripe/connect", { method: "POST" });
                                            const data = await res.json();
                                            if (data.url) window.location.href = data.url;
                                            else toast.error("Failed to start connection");
                                        } catch (e) { toast.error("Error connecting"); }
                                    }}
                                    className="btn btn-primary"
                                >
                                    Connect Bank Account
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                    </svg>
                                </button>
                                <p className="text-xs text-base-content/50 mt-2">
                                    Secure payments powered by Stripe
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Subscription */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Subscription & Billing</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                            <div>
                                <p className="font-medium">Current Plan</p>
                                <p className="text-base-content/60">
                                    {organization?.plan_name ? (
                                        <>
                                            {organization.plan_name} - {organization.plan_name === "Growth" ? "$19" : "$9"}/month
                                        </>
                                    ) : (
                                        "No Active Plan"
                                    )}
                                </p>
                            </div>
                            <span
                                className={`badge ${organization?.subscription_status === 'active'
                                    ? 'badge-success'
                                    : organization?.subscription_status === 'past_due'
                                        ? 'badge-warning'
                                        : 'badge-neutral'
                                    }`}
                            >
                                {organization?.subscription_status ? (
                                    organization.subscription_status.charAt(0).toUpperCase() + organization.subscription_status.slice(1)
                                ) : (
                                    "Inactive"
                                )}
                            </span>
                        </div>

                        <p className="text-sm text-base-content/60">
                            Manage your subscription, update payment method, or cancel your plan through the billing portal.
                        </p>

                        <button
                            type="button"
                            onClick={handleBilling}
                            className="btn btn-outline"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                            Manage Billing & Subscription
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSaving}
                    >
                        {isSaving && <span className="loading loading-spinner loading-sm" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
