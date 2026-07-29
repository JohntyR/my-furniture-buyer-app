import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = orders.reduce(
    (total, order) => total + order.priceAtOrder * order.quantity,
    0
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-6">
      <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>

      <div className="rounded-lg border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">Total spent</span>
        <p className="text-2xl font-semibold text-gray-900">${totalSpent.toFixed(2)}</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Price each</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2 text-gray-900">{order.product.name}</td>
                  <td className="px-4 py-2 text-gray-600">{order.quantity}</td>
                  <td className="px-4 py-2 text-gray-600">${order.priceAtOrder.toFixed(2)}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    ${(order.priceAtOrder * order.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
