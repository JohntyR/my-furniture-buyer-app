// Client for the furniture shop's real catalogue/order API (see the Day 1
// Participant Guide). This is a genuine external service: the balance it
// returns and the orders it places are real for the event, not test data.
//
// The API is scoped to a single participant identity (one user_id + key per
// team), so every call here always acts as that one identity regardless of
// which local app account is logged in.

const BASE_URL = process.env.PRODUCT_API_BASE_URL;
const API_USER = process.env.PRODUCT_API_USER;
const API_KEY = process.env.PRODUCT_API_KEY;

function assertConfigured() {
  if (!BASE_URL || !API_USER || !API_KEY) {
    throw new Error(
      "PRODUCT_API_BASE_URL, PRODUCT_API_USER, and PRODUCT_API_KEY must all be set in .env."
    );
  }
}

// Returns { user_id, name, balance }.
export async function getBalance() {
  assertConfigured();
  const response = await fetch(`${BASE_URL}/users/${API_USER}`, {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch balance from the furniture shop API (${response.status}).`);
  }

  return response.json();
}

// Places a real order, which really debits the real balance.
// Returns { ok: true, data: { order_id, status, total_price, remaining_balance } }
// or { ok: false, status, error } on failure (e.g. 402 insufficient balance, 404 unknown item).
export async function placeRealOrder(itemId, quantity) {
  assertConfigured();
  const response = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
    // The live API expects an `items` array (undocumented in the Day 1
    // guide, which showed a flat item_id/quantity body - confirmed against
    // the real endpoint before wiring this up).
    body: JSON.stringify({ user_id: API_USER, items: [{ item_id: itemId, quantity }] }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false, status: response.status, error: data };
  }

  return { ok: true, data };
}
