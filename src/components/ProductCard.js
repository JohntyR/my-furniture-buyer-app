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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-oak/50 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Photo sits on its own tinted "mat" so a white product photo never
          blends into the card - only this small area is oak, not the card. */}
      <div className="relative m-3 mb-0 aspect-square overflow-hidden rounded-xl bg-oak/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-plum shadow-sm backdrop-blur">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="font-semibold leading-snug text-plum">{product.name}</h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-plum/55">{product.description}</p>
        </div>

        <p className="text-xl font-bold text-grape">${product.price.toFixed(2)}</p>

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

        <div className="mt-auto flex items-center gap-2 pt-1">
          <div className="flex items-center overflow-hidden rounded-full border border-oak/60">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2.5 py-2 text-plum transition hover:bg-oak/25"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium text-plum">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-2.5 py-2 text-plum transition hover:bg-oak/25"
            >
              +
            </button>
          </div>

          <button
            onClick={handleBuy}
            disabled={status === "buying"}
            className="flex-1 rounded-full bg-tomato px-4 py-2 text-sm font-medium text-white transition hover:bg-tomato/90 disabled:opacity-50"
          >
            {status === "buying" ? "Buying..." : "Buy"}
          </button>
        </div>
      </div>
    </div>
  );
}
