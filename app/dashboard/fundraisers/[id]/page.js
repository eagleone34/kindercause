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
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Transactions state
    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(false);
    const [txFilter, setTxFilter] = useState("all");
    const [txSearch, setTxSearch] = useState("");
    const [txTotal, setTxTotal] = useState(0);

    useEffect(() => {
        fetchFundraiser();
    }, [params.id]);

    useEffect(() => {
        if (fundraiser) {
            fetchTransactions();
        }
    }, [fundraiser, txFilter, txSearch]);

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

    const fetchTransactions = async () => {
        setTxLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (txFilter !== "all") queryParams.set("status", txFilter);
            if (txSearch) queryParams.set("search", txSearch);

            const res = await fetch(`/api/fundraisers/${params.id}/transactions?${queryParams}`);
            const data = await res.json();
            setTransactions(data.transactions || []);
            setTxTotal(data.total || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setTxLoading(false);
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

            if (!res.ok) throw new Error("Failed to publish");

            toast.success("Fundraiser published!");
            setFundraiser((prev) => ({ ...prev, status: "active" }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDeactivate = async () => {
        setIsPublishing(true);
        try {
            const res = await fetch(`/api/fundraisers/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
            });

            if (!res.ok) throw new Error("Failed to deactivate");

            toast.success("Fundraiser deactivated");
            setFundraiser((prev) => ({ ...prev, status: "cancelled" }));
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/fundraisers/${params.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }

            toast.success("Fundraiser deleted");
            router.push("/dashboard/fundraisers");
        } catch (error) {
            toast.error(error.message);
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
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
    const hasTransactions = txTotal > 0;
    const canDelete = fundraiser.status === "draft" || !hasTransactions;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Delete Fundraiser?</h3>
                        <p className="py-4">
                            Are you sure you want to delete &quot;{fundraiser.name}&quot;? This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting && <span className="loading loading-spinner loading-sm" />}
                                Delete
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)} />
                </div>
            )}

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
                <span className={`badge ${fundraiser.status === "active" ? "badge-success" :
                    fundraiser.status === "cancelled" ? "badge-error" :
                        "badge-ghost"
                    }`}>
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
                            <div className="stat-value text-success">${(fundraiser.current_amount || 0).toLocaleString()}</div>
                        </div>
                        {fundraiser.goal_amount && (
                            <div className="stat">
                                <div className="stat-title">Goal</div>
                                <div className="stat-value">${fundraiser.goal_amount.toLocaleString()}</div>
                                <div className="stat-desc">
                                    {Math.round(((fundraiser.current_amount || 0) / fundraiser.goal_amount) * 100)}% complete
                                </div>
                            </div>
                        )}
                        <div className="stat">
                            <div className="stat-title">Transactions</div>
                            <div className="stat-value">{txTotal}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Actions */}
            {fundraiser.status === "active" && (
                <div className="bg-base-100 rounded-box shadow p-6">
                    <h2 className="font-semibold text-lg mb-4">🚀 Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        {/* Copy Purchase Link */}
                        <button
                            className="btn btn-outline gap-2"
                            onClick={() => {
                                const publicUrl = `${window.location.origin}/${fundraiser.organization?.slug}/${fundraiser.slug}`;
                                navigator.clipboard.writeText(publicUrl);
                                toast.success("Purchase link copied!");
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                            Copy Purchase Link
                        </button>

                        {/* Email Attendees/Donors */}
                        <Link
                            href={`/dashboard/emails/new?fundraiser=${params.id}&type=${isEvent ? 'attendees' : 'donors'}`}
                            className="btn btn-outline gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            Email {isEvent ? "Attendees" : "Donors"} ({txTotal})
                        </Link>

                        {/* Share Event */}
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-outline gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                                </svg>
                                Share
                            </label>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li>
                                    <button onClick={() => {
                                        const publicUrl = `${window.location.origin}/${fundraiser.organization?.slug}/${fundraiser.slug}`;
                                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`, '_blank');
                                    }}>
                                        📘 Share on Facebook
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => {
                                        const publicUrl = `${window.location.origin}/${fundraiser.organization?.slug}/${fundraiser.slug}`;
                                        const text = `Check out ${fundraiser.name}!`;
                                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(text)}`, '_blank');
                                    }}>
                                        🐦 Share on X
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => {
                                        const publicUrl = `${window.location.origin}/${fundraiser.organization?.slug}/${fundraiser.slug}`;
                                        const text = `Check out ${fundraiser.name}! ${publicUrl}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                    }}>
                                        💬 Share on WhatsApp
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* View Public Page */}
                        <a
                            href={`/${fundraiser.organization?.slug}/${fundraiser.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            View Public Page
                        </a>
                    </div>
                </div>
            )}

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

            {/* Transactions */}
            <div className="bg-base-100 rounded-box shadow p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="font-semibold text-lg">Transactions ({txTotal})</h2>
                    <div className="flex gap-2">
                        <select
                            className="select select-bordered select-sm"
                            value={txFilter}
                            onChange={(e) => setTxFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input input-bordered input-sm w-40"
                            value={txSearch}
                            onChange={(e) => setTxSearch(e.target.value)}
                        />
                    </div>
                </div>

                {txLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                        No transactions yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                        <td>{tx.purchaser_name}</td>
                                        <td className="text-sm text-base-content/70">{tx.purchaser_email}</td>
                                        <td className="font-medium">${tx.amount}</td>
                                        <td>
                                            <span className={`badge badge-sm ${tx.status === "completed" ? "badge-success" :
                                                tx.status === "refunded" ? "badge-warning" :
                                                    "badge-ghost"
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
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

                {fundraiser.status === "active" && hasTransactions && (
                    <button
                        className="btn btn-warning"
                        onClick={handleDeactivate}
                        disabled={isPublishing}
                    >
                        {isPublishing && <span className="loading loading-spinner loading-sm" />}
                        Deactivate
                    </button>
                )}

                {canDelete && (
                    <button
                        className="btn btn-error btn-outline"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
