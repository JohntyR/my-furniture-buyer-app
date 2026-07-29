import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getRemainingBudget } from "@/lib/budget";

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

  const cost = product.price * quantity;
  const remainingBudget = await getRemainingBudget(user.id);

  if (cost > remainingBudget) {
    return NextResponse.json(
      { error: "This order would exceed your remaining budget." },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      quantity,
      priceAtOrder: product.price,
    },
    include: { product: true },
  });

  return NextResponse.json({
    order,
    remainingBudget: remainingBudget - cost,
  });
}
