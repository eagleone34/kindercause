"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewContactPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        group: "",
        children: [], // Array of { name, birthdate, class }
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            if (data.groups) setGroups(data.groups);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Children handlers
    const addChild = () => {
        setFormData((prev) => ({
            ...prev,
            children: [...prev.children, { name: "", birthdate: "", class: "" }],
        }));
    };

    const updateChild = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            children: prev.children.map((child, i) =>
                i === index ? { ...child, [field]: value } : child
            ),
        }));
    };

    const removeChild = (index) => {
        setFormData((prev) => ({
            ...prev,
            children: prev.children.filter((_, i) => i !== index),
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
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    tags: formData.group ? [formData.group] : [],
                    children: formData.children.filter(c => c.name), // Only save children with names
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
                {/* Contact Info */}
                <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                    <h2 className="font-semibold">Contact Information</h2>

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
                            <option value="">Select a group...</option>
                            {groups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                        <label className="label">
                            <span className="label-text-alt">Categorize contacts for targeted email campaigns</span>
                        </label>
                    </div>
                </div>

                {/* Children Section */}
                <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">👶 Children</h2>
                            <p className="text-sm text-base-content/60">Add children for personalized communications</p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={addChild}
                        >
                            + Add Child
                        </button>
                    </div>

                    {formData.children.length === 0 ? (
                        <div className="text-center py-6 text-base-content/50">
                            <span className="text-4xl block mb-2">👶</span>
                            <p>No children added yet</p>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm mt-2"
                                onClick={addChild}
                            >
                                + Add a child
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {formData.children.map((child, index) => (
                                <div key={index} className="border border-base-300 rounded-lg p-4 bg-base-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-sm">Child {index + 1}</span>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs text-error"
                                            onClick={() => removeChild(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs">Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={child.name}
                                                onChange={(e) => updateChild(index, "name", e.target.value)}
                                                placeholder="Emma"
                                                className="input input-bordered input-sm w-full"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs">Birthdate</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={child.birthdate}
                                                onChange={(e) => updateChild(index, "birthdate", e.target.value)}
                                                className="input input-bordered input-sm w-full"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs">Class/Room</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={child.class}
                                                onChange={(e) => updateChild(index, "class", e.target.value)}
                                                placeholder="Butterfly Room"
                                                className="input input-bordered input-sm w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
