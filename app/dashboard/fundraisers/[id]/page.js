"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function FundraiserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [fundraiser, setFundraiser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        fetchFundraiser();
    }, [params.id]);

    const fetchFundraiser = async () => {
        try {
            const res = await fetch(`/api/fundraisers/${params.id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    toast.error("Fundraiser not found");
                    router.push("/dashboard/fundraisers");
                    return;
                }
                throw new Error("Failed to fetch fundraiser");
            }
            const data = await res.json();
            setFundraiser(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load fundraiser");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const res = await fetch(`/api/fundraisers/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "active" }),
            });

            if (!res.ok) {
                throw new Error("Failed to publish");
            }

            toast.success("Fundraiser published!");
            setFundraiser((prev) => ({ ...prev, status: "active" }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!fundraiser) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Fundraiser not found</h2>
                <Link href="/dashboard/fundraisers" className="btn btn-primary">
                    Back to Fundraisers
                </Link>
            </div>
        );
    }

    const isEvent = fundraiser.type === "event";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href="/dashboard/fundraisers" className="btn btn-ghost btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{isEvent ? "🎟️" : "💝"}</span>
                        <h1 className="text-2xl font-bold">{fundraiser.name}</h1>
                    </div>
                    <p className="text-base-content/70">
                        {isEvent ? "Event" : "Donation Campaign"}
                    </p>
                </div>
                <span className={`badge ${fundraiser.status === "active" ? "badge-success" : "badge-ghost"}`}>
                    {fundraiser.status}
                </span>
            </div>

            {/* Stats */}
            <div className="stats shadow bg-base-100 w-full">
                {isEvent ? (
                    <>
                        <div className="stat">
                            <div className="stat-title">Ticket Price</div>
                            <div className="stat-value text-primary">${fundraiser.ticket_price}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Tickets Sold</div>
                            <div className="stat-value">{fundraiser.tickets_sold || 0}</div>
                            {fundraiser.capacity && <div className="stat-desc">of {fundraiser.capacity} available</div>}
                        </div>
                        <div className="stat">
                            <div className="stat-title">Revenue</div>
                            <div className="stat-value text-success">
                                ${((fundraiser.tickets_sold || 0) * (fundraiser.ticket_price || 0)).toLocaleString()}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="stat">
                            <div className="stat-title">Raised</div>
                            <div className="stat-value text-success">${(fundraiser.amount_raised || 0).toLocaleString()}</div>
                        </div>
                        {fundraiser.goal_amount && (
                            <div className="stat">
                                <div className="stat-title">Goal</div>
                                <div className="stat-value">${fundraiser.goal_amount.toLocaleString()}</div>
                                <div className="stat-desc">
                                    {Math.round(((fundraiser.amount_raised || 0) / fundraiser.goal_amount) * 100)}% complete
                                </div>
                            </div>
                        )}
                        <div className="stat">
                            <div className="stat-title">Donors</div>
                            <div className="stat-value">{fundraiser.donor_count || 0}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Details */}
            <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                <h2 className="font-semibold text-lg">Details</h2>

                {fundraiser.description && (
                    <div>
                        <label className="text-sm text-base-content/60">Description</label>
                        <p className="mt-1">{fundraiser.description}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-base-content/60">Start Date</label>
                        <p className="mt-1">{new Date(fundraiser.start_date).toLocaleDateString()}</p>
                    </div>
                    {fundraiser.end_date && (
                        <div>
                            <label className="text-sm text-base-content/60">End Date</label>
                            <p className="mt-1">{new Date(fundraiser.end_date).toLocaleDateString()}</p>
                        </div>
                    )}
                    {isEvent && fundraiser.location && (
                        <div>
                            <label className="text-sm text-base-content/60">Location</label>
                            <p className="mt-1">{fundraiser.location}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <Link href={`/dashboard/fundraisers/${params.id}/edit`} className="btn btn-outline">
                    Edit
                </Link>
                {fundraiser.status === "draft" && (
                    <button
                        className="btn btn-primary"
                        onClick={handlePublish}
                        disabled={isPublishing}
                    >
                        {isPublishing && <span className="loading loading-spinner loading-sm" />}
                        {isPublishing ? "Publishing..." : "Publish"}
                    </button>
                )}
            </div>
        </div>
    );
}

