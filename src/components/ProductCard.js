"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("idle"); // idle | buying
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  async function handleBuy() {
    setStatus("buying");
    setError("");
    setConfirmation(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: product.itemId, quantity }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setConfirmation(data);
      router.refresh();
    } catch {
      setError("Couldn't reach the shop right now. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {product.category}
        </span>
        <h2 className="font-semibold text-gray-900">{product.name}</h2>
        <p className="flex-1 text-sm text-gray-600">{product.description}</p>
        <p className="text-lg font-semibold text-gray-900">${product.price.toFixed(2)}</p>

        <div className="flex items-center gap-2">
          <label htmlFor={`qty-${product.itemId}`} className="text-sm text-gray-600">
            Qty
          </label>
          <input
            id={`qty-${product.itemId}`}
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {confirmation && (
          <p className="text-xs text-green-700">
            Order placed{confirmation.orderId ? ` (#${confirmation.orderId})` : ""}
            {typeof confirmation.totalPrice === "number"
              ? ` for $${confirmation.totalPrice.toFixed(2)}.`
              : "."}
            {typeof confirmation.remainingBalance === "number"
              ? ` Remaining balance: $${confirmation.remainingBalance.toFixed(2)}.`
              : ""}
          </p>
        )}

        <button
          onClick={handleBuy}
          disabled={status === "buying"}
          className="mt-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {status === "buying" ? "Buying..." : "Buy"}
        </button>
      </div>
    </div>
  );
}
