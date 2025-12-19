"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

// Fundraisers List Page
export default function FundraisersPage() {
  const [fundraisers, setFundraisers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const fetchFundraisers = async () => {
    try {
      const res = await fetch("/api/fundraisers");
      const data = await res.json();
      if (data.fundraisers) {
        setFundraisers(data.fundraisers);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fundraisers");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFundraisers = fundraisers.filter((f) => {
    if (filter === "all") return true;
    if (filter === "events") return f.type === "event";
    if (filter === "campaigns") return f.type === "donation_campaign";
    if (filter === "active") return f.status === "active";
    if (filter === "draft") return f.status === "draft";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fundraisers</h1>
          <p className="text-base-content/70">
            Manage your events and donation campaigns
          </p>
        </div>
        <Link href="/dashboard/fundraisers/new" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Fundraiser
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`btn btn-sm ${filter === "all" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setFilter("all")}
        >
          All ({fundraisers.length})
        </button>
        <button
          className={`btn btn-sm ${filter === "events" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setFilter("events")}
        >
          Events
        </button>
        <button
          className={`btn btn-sm ${filter === "campaigns" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setFilter("campaigns")}
        >
          Campaigns
        </button>
        <button
          className={`btn btn-sm ${filter === "active" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={`btn btn-sm ${filter === "draft" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setFilter("draft")}
        >
          Draft
        </button>
      </div>

      {/* Fundraisers Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filteredFundraisers.length === 0 ? (
        <div className="bg-base-100 rounded-box shadow p-12 text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-xl font-semibold mb-2">
            {fundraisers.length === 0 ? "No fundraisers yet" : "No matches found"}
          </h2>
          <p className="text-base-content/60 mb-6 max-w-md mx-auto">
            {fundraisers.length === 0
              ? "Create your first event or donation campaign to start raising funds for your daycare."
              : "Try adjusting your filters."}
          </p>
          {fundraisers.length === 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/fundraisers/new?type=event"
                className="btn btn-primary"
              >
                🎟️ Create Event
              </Link>
              <Link
                href="/dashboard/fundraisers/new?type=donation_campaign"
                className="btn btn-secondary"
              >
                💝 Start Campaign
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFundraisers.map((fundraiser) => (
            <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
          ))}
        </div>
      )}
    </div>
  );
}

function FundraiserCard({ fundraiser }) {
  const isEvent = fundraiser.type === "event";
  const progress = fundraiser.goal_amount
    ? ((fundraiser.amount_raised || 0) / fundraiser.goal_amount) * 100
    : 0;

  return (
    <Link
      href={`/dashboard/fundraisers/${fundraiser.id}`}
      className="bg-base-100 rounded-box shadow hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-video bg-base-200 relative">
        {fundraiser.image_url ? (
          <Image
            src={fundraiser.image_url}
            alt={fundraiser.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {isEvent ? "🎟️" : "💝"}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`badge ${fundraiser.status === "active" ? "badge-success" :
            fundraiser.status === "completed" ? "badge-info" :
              "badge-ghost"
            }`}>
            {fundraiser.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-1">{fundraiser.name}</h3>
          <span className="text-xs text-base-content/60 whitespace-nowrap">
            {isEvent ? "Event" : "Campaign"}
          </span>
        </div>

        {/* Progress for campaigns */}
        {!isEvent && fundraiser.goal_amount && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-primary">
                ${(fundraiser.amount_raised || 0).toLocaleString()}
              </span>
              <span className="text-base-content/60">
                of ${fundraiser.goal_amount.toLocaleString()}
              </span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={progress}
              max="100"
            />
          </div>
        )}

        {/* Event details */}
        {isEvent && (
          <div className="flex items-center gap-4 text-sm text-base-content/60 mb-3">
            <span>🎟️ {fundraiser.tickets_sold || 0} sold</span>
            <span>💰 ${((fundraiser.tickets_sold || 0) * (fundraiser.ticket_price || 0)).toLocaleString()}</span>
          </div>
        )}

        {/* Date */}
        <p className="text-sm text-base-content/60">
          📅 {new Date(fundraiser.start_date).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
