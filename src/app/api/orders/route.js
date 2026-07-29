import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { placeRealOrder } from "@/lib/productApi";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { productId, quantity = 1 } = await request.json();

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Quantity must be a whole number of at least 1." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const result = await placeRealOrder(product.itemId, quantity);

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

  // Kept locally too, purely as order history for the "My Orders" page -
  // the furniture shop API is now the source of truth for balance.
  await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      quantity,
      priceAtOrder: product.price,
    },
  });

  return NextResponse.json({ orderId, totalPrice, remainingBalance });
}
