"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import apiClient from "@/libs/api";

// Default contact groups (can't be deleted)
const DEFAULT_GROUPS = [
    "Parents",
    "Volunteers",
    "Donors",
    "Board Members",
    "Alumni",
    "Staff",
    "Sponsors",
    "Other",
];

export default function SettingsPage() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [groups, setGroups] = useState([]);
    const [customGroups, setCustomGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
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
                    email: data.email || session?.user?.email || "",
                    phone: data.phone || "",
                    website: data.website || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    zip: data.zip || "",
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
                setCustomGroups(data.customGroups || []);
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
        if (!confirm(`Delete group "${groupName}"? Contacts in this group will not be deleted.`)) {
            return;
        }

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
            console.error(e);
            toast.error("Unable to open billing portal. Please try again.");
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
                                <span className="label-text font-medium">Organization Name *</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="My Daycare Center"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Contact Email *</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contact@example.com"
                                className="input input-bordered w-full"
                                required
                            />
                            <label className="label">
                                <span className="label-text-alt">This email receives notifications and appears on receipts</span>
                            </label>
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
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://www.example.com"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Public URL Slug</span>
                            </label>
                            <div className="join">
                                <span className="btn btn-disabled join-item lowercase font-normal">kindercause.com/</span>
                                <input
                                    type="text"
                                    value={organization?.slug || ""}
                                    className="input input-bordered join-item w-full bg-base-200"
                                    disabled
                                />
                            </div>
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

                {/* User Profile */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Your Profile</h2>

                    <div className="flex items-center gap-4 mb-6">
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name}
                                className="w-16 h-16 rounded-full border border-base-300"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                {session?.user?.name?.[0] || "U"}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-lg">{session?.user?.name}</p>
                            <p className="text-base-content/60">{session?.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Contact Groups */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Contact Groups</h2>
                    <p className="text-base-content/60 mb-4">
                        Organize your contacts into groups for targeted email campaigns.
                    </p>

                    {/* Default Groups */}
                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Default Groups</h3>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_GROUPS.map((group) => (
                                <span key={group} className="badge badge-lg badge-outline">
                                    {group}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Custom Groups */}
                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Custom Groups</h3>
                        {customGroups.length === 0 ? (
                            <p className="text-base-content/50 text-sm">No custom groups yet</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {customGroups.map((group) => (
                                    <span key={group} className="badge badge-lg gap-1">
                                        {group}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGroup(group)}
                                            className="hover:text-error"
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

                {/* Subscription */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Subscription & Billing</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                            <div>
                                <p className="font-medium">Current Plan</p>
                                <p className="text-base-content/60">Pro Plan - $29/month</p>
                            </div>
                            <span className="badge badge-success">Active</span>
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
