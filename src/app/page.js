import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getRemainingBudget } from "@/lib/budget";
import BudgetBar from "@/components/BudgetBar";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [products, remainingBudget] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    getRemainingBudget(user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-6 py-6">
      <BudgetBar budget={user.budget} remaining={remainingBudget} />

      <div>
        <h1 className="mb-4 text-xl font-semibold text-gray-900">Catalogue</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
