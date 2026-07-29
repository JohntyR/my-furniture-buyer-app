import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderHistory } from "@/lib/productApi";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await getOrderHistory().catch(() => null);

  if (orders === null) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
        <p className="text-sm text-red-600">
          Couldn&apos;t load your order history from the furniture shop right now. Please try
          again.
        </p>
      </div>
    );
  }

  const totalSpent = orders.reduce((total, order) => total + order.total_amount, 0);

  // Each order can contain more than one item; flatten to one row per item.
  const rows = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.order_id,
      timestamp: order.timestamp,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }))
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-6">
      <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>

      <div className="rounded-lg border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">Total spent</span>
        <p className="text-2xl font-semibold text-gray-900">${totalSpent.toFixed(2)}</p>
      </div>

      {rows.length === 0 ? (
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
              {rows.map((row, index) => (
                <tr key={`${row.orderId}-${index}`}>
                  <td className="px-4 py-2 text-gray-900">{row.productName}</td>
                  <td className="px-4 py-2 text-gray-600">{row.quantity}</td>
                  <td className="px-4 py-2 text-gray-600">${row.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    ${(row.unitPrice * row.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(row.timestamp).toLocaleDateString()}
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
