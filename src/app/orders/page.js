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
        <h1 className="text-xl font-semibold text-plum">My Orders</h1>
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
      <h1 className="text-xl font-semibold text-plum">My Orders</h1>

      <div className="rounded-xl border border-oak/50 bg-gradient-to-r from-grape to-plum p-4 shadow-sm">
        <span className="text-sm font-medium text-white/80">Total spent</span>
        <p className="text-2xl font-semibold text-white">${totalSpent.toFixed(2)}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-plum/50">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-oak/60 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-oak/25 text-left text-plum">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Price each</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oak/30">
              {rows.map((row, index) => (
                <tr key={`${row.orderId}-${index}`} className="transition hover:bg-oak/10">
                  <td className="px-4 py-2 text-plum">{row.productName}</td>
                  <td className="px-4 py-2 text-plum/70">{row.quantity}</td>
                  <td className="px-4 py-2 text-plum/70">${row.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 font-medium text-grape">
                    ${(row.unitPrice * row.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-plum/50">
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
