import Link from "next/link";

function hrefForPage(page, query) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export default function Pagination({ currentPage, totalPages, query }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-2 text-sm">
      {currentPage > 1 ? (
        <Link
          href={hrefForPage(currentPage - 1, query)}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-gray-200 px-3 py-1 text-gray-300">Previous</span>
      )}

      <span className="text-gray-600">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={hrefForPage(currentPage + 1, query)}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-gray-200 px-3 py-1 text-gray-300">Next</span>
      )}
    </div>
  );
}
