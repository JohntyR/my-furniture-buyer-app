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

// The catalogue has 762 products; search-index returns all of them in one
// fast, image-free call (unlike plain /catalogue, which embeds every image
// as base64 and can take 20+ seconds - the Day 1 guide explicitly warns
// against using it for browsing). Cached briefly since catalogue data
// doesn't change during the event and this endpoint has no free-text
// search of its own - filtering/pagination for the UI happens in-memory
// over this full list.
export async function searchCatalogue() {
  if (!BASE_URL) {
    throw new Error("PRODUCT_API_BASE_URL is not set. Add it to your .env file.");
  }
  const response = await fetch(`${BASE_URL}/catalogue/search-index?limit=1000`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch the catalogue (${response.status}).`);
  }

  return response.json();
}

// Turns a raw search-index item into what the UI actually renders.
// Dimensions/colours aren't shown as their own fields anywhere in the UI,
// so they're folded into a human-readable description here instead.
export function toDisplayProduct(item) {
  const dimensions = [item.width, item.depth, item.height].filter(
    (value) => typeof value === "number"
  );
  const dimensionsText = dimensions.length ? `${dimensions.join(" × ")} cm` : null;
  const colourText = item.colours?.length ? item.colours.join(", ") : null;
  const description = [item.category, colourText, dimensionsText].filter(Boolean).join(" — ");

  return {
    itemId: item.item_id,
    name: item.product_name,
    category: item.category,
    description,
    price: item.price,
    imageUrl: `${BASE_URL}/catalogue/${item.item_id}/image`,
  };
}

// Returns this participant's real past orders:
// [{ order_id, items: [{ product_id, quantity, unit_price, product_name }], total_amount, timestamp }]
export async function getOrderHistory() {
  assertConfigured();
  const response = await fetch(`${BASE_URL}/orders/${API_USER}`, {
    headers: { "X-Api-Key": API_KEY },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order history from the furniture shop API (${response.status}).`);
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
