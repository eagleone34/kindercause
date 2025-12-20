"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// Predefined contact groups for categorization
const CONTACT_GROUPS = [
    { value: "", label: "Select a group..." },
    { value: "Parents", label: "Parents" },
    { value: "Volunteers", label: "Volunteers" },
    { value: "Donors", label: "Donors" },
    { value: "Board Members", label: "Board Members" },
    { value: "Alumni", label: "Alumni" },
    { value: "Staff", label: "Staff" },
    { value: "Sponsors", label: "Sponsors" },
    { value: "Other", label: "Other" },
];

export default function EditContactPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        group: "",
    });

    useEffect(() => {
        fetchContact();
    }, [params.id]);

    const fetchContact = async () => {
        try {
            const res = await fetch(`/api/contacts/${params.id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    toast.error("Contact not found");
                    router.push("/dashboard/contacts");
                    return;
                }
                throw new Error("Failed to fetch contact");
            }
            const data = await res.json();
            setFormData({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                email: data.email || "",
                phone: data.phone || "",
                group: data.tags?.[0] || "",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load contact");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/contacts/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    tags: formData.group ? [formData.group] : [],
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update contact");
            }

            toast.success("Contact updated successfully!");
            router.push("/dashboard/contacts");
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

    return (
        <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/contacts"
                    className="btn btn-ghost btn-sm mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back to Contacts
                </Link>
                <h1 className="text-2xl font-bold">Edit Contact</h1>
                <p className="text-base-content/70">
                    Update contact information
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">First Name *</span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="John"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Last Name</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Smith"
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Email *</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Phone</span>
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
                            <span className="label-text font-medium">Group</span>
                        </label>
                        <select
                            name="group"
                            value={formData.group}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            {CONTACT_GROUPS.map((group) => (
                                <option key={group.value} value={group.value}>
                                    {group.label}
                                </option>
                            ))}
                        </select>
                        <label className="label">
                            <span className="label-text-alt">Categorize contacts for targeted email campaigns</span>
                        </label>
                    </div>
                </div>

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
                    <Link href="/dashboard/contacts" className="btn btn-ghost">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
