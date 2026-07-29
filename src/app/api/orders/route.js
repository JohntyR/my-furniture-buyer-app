import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { placeRealOrder } from "@/lib/productApi";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { itemId, quantity = 1 } = await request.json();

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Quantity must be a whole number of at least 1." },
      { status: 400 }
    );
  }

  const result = await placeRealOrder(itemId, quantity);

  if (!result.ok) {
    if (result.status === 402) {
      return NextResponse.json(
        { error: "Insufficient balance for this purchase." },
        { status: 402 }
      );
    }
    if (result.status === 404) {
      return NextResponse.json(
        { error: "This product is no longer available in the shop's catalogue." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Could not place the order with the furniture shop right now. Please try again." },
      { status: 502 }
    );
  }

  const { order_id: orderId, total_price: totalPrice, remaining_balance: remainingBalance } =
    result.data;

  return NextResponse.json({ orderId, totalPrice, remainingBalance });
}
