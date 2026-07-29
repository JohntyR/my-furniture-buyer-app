import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getBalance } from "@/lib/productApi";
import BudgetBar from "@/components/BudgetBar";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 24;

export default async function HomePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const page = Math.max(1, Number(params?.page) || 1);

  const where = query
    ? {
        OR: [{ name: { contains: query } }, { description: { contains: query } }],
      }
    : {};

  const [products, totalCount, balanceResult] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    getBalance().catch(() => null),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-6 py-6">
      <BudgetBar balance={balanceResult?.balance} error={!balanceResult} />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Catalogue</h1>
          <div className="w-full sm:max-w-xs">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-gray-500">No products match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} query={query} />
      </div>
    </div>
  );
}
