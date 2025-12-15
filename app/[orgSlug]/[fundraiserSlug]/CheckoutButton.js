"use client";

import { useState } from "react";
import toast from "react-hot-toast";

// Client component for handling checkout
export default function CheckoutButton({ fundraiser, type }) {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [donationAmount, setDonationAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const isEvent = type === "event";
  const presetAmounts = [25, 50, 100, 250];

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const payload = {
        fundraiserId: fundraiser.id,
        type: isEvent ? "ticket" : "donation",
      };

      if (isEvent) {
        payload.quantity = quantity;
        payload.amount = fundraiser.ticket_price * quantity;
      } else {
        payload.amount = customAmount ? parseFloat(customAmount) : donationAmount;
        payload.isRecurring = isRecurring && fundraiser.allow_recurring;
      }

      // Validate amount
      if (!payload.amount || payload.amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEvent) {
    // Event ticket purchase
    const maxTickets = fundraiser.capacity
      ? Math.min(10, fundraiser.capacity - fundraiser.tickets_sold)
      : 10;

    return (
      <div className="space-y-4">
        {/* Quantity Selector */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Number of Tickets</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-circle btn-sm btn-outline"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              className="btn btn-circle btn-sm btn-outline"
              onClick={() => setQuantity(Math.min(maxTickets, quantity + 1))}
              disabled={quantity >= maxTickets}
            >
              +
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Total</span>
            <span className="text-2xl font-bold">
              ${(fundraiser.ticket_price * quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Processing...
            </>
          ) : (
            <>
              🎟️ Buy {quantity} Ticket{quantity > 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    );
  }

  // Donation campaign
  return (
    <div className="space-y-4">
      {/* Preset Amounts */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Select Amount</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              className={`btn ${
                donationAmount === amount && !customAmount
                  ? "btn-primary"
                  : "btn-outline"
              }`}
              onClick={() => {
                setDonationAmount(amount);
                setCustomAmount("");
              }}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Or enter custom amount</span>
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="text-base-content/60">$</span>
          <input
            type="number"
            placeholder="Other amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              if (e.target.value) {
                setDonationAmount(0);
              }
            }}
            min="1"
            step="1"
            className="grow"
          />
        </label>
      </div>

      {/* Recurring Option */}
      {fundraiser.allow_recurring && (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <div>
              <span className="label-text font-medium">
                Make this a monthly donation
              </span>
              <p className="text-xs text-base-content/60">
                Support every month (cancel anytime)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Total */}
      <div className="bg-base-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-base-content/70">
            {isRecurring ? "Monthly" : "One-time"} donation
          </span>
          <span className="text-2xl font-bold">
            ${customAmount || donationAmount}
          </span>
        </div>
      </div>

      {/* Donate Button */}
      <button
        className="btn btn-primary w-full"
        onClick={handleCheckout}
        disabled={isLoading || (!donationAmount && !customAmount)}
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            Processing...
          </>
        ) : (
          <>
            💝 Donate ${customAmount || donationAmount}
            {isRecurring ? "/month" : ""}
          </>
        )}
      </button>
    </div>
  );
}
