"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewContactPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        tags: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags
                        ? formData.tags.split(",").map((t) => t.trim())
                        : [],
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create contact");
            }

            toast.success("Contact added successfully!");
            router.push("/dashboard/contacts");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                <h1 className="text-2xl font-bold">Add New Contact</h1>
                <p className="text-base-content/70">
                    Add a parent or donor to your contact list
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Name *</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Smith"
                            className="input input-bordered w-full"
                            required
                        />
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
                            <span className="label-text font-medium">Tags</span>
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Parent, Volunteer, Donor"
                            className="input input-bordered w-full"
                        />
                        <label className="label">
                            <span className="label-text-alt">Separate multiple tags with commas</span>
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading && <span className="loading loading-spinner loading-sm" />}
                        {isLoading ? "Adding..." : "Add Contact"}
                    </button>
                    <Link href="/dashboard/contacts" className="btn btn-ghost">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
