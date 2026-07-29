import { prisma } from "./db";

// Remaining budget = the user's total budget minus what they've already spent,
// where each order's cost is locked in at the price it was ordered at.
export async function getRemainingBudget(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const orders = await prisma.order.findMany({ where: { userId } });

  const spent = orders.reduce(
    (total, order) => total + order.priceAtOrder * order.quantity,
    0
  );

  return user.budget - spent;
}
