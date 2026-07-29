import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { placeRealOrder } from "@/lib/productApi";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { itemId, quantity = 1 } = body ?? {};

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Quantity must be a whole number of at least 1." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await placeRealOrder(itemId, quantity);
  } catch (error) {
    console.error("Unexpected error placing an order:", error);
    return NextResponse.json(
      { error: "Could not place the order with the furniture shop right now. Please try again." },
      { status: 502 }
    );
  }

  if (!result.ok) {
    if (result.status === 402) {
      return NextResponse.json(
        { error: "Insufficient balance for this purchase." },
        { status: 402 }
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { error: "This item is no longer available in the shop's catalogue." },
        { status: 404 }
      );
    }
    if (result.status === 429) {
      return NextResponse.json(
        { error: "The furniture shop is busy right now. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Could not place the order with the furniture shop right now. Please try again." },
      { status: 502 }
    );
  }

  const orderId = result.data?.order_id ?? null;
  const totalPrice = result.data?.total_price ?? null;
  const remainingBalance = result.data?.remaining_balance ?? null;

  return NextResponse.json({ orderId, totalPrice, remainingBalance });
}
