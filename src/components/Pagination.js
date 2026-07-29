import Link from "next/link";

function hrefForPage(page, query) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/catalogue?${params.toString()}`;
}

export default function Pagination({ currentPage, totalPages, query }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-2 text-sm">
      {currentPage > 1 ? (
        <Link
          href={hrefForPage(currentPage - 1, query)}
          className="rounded-full border border-oak/60 bg-white px-3 py-1 text-plum transition hover:border-grape hover:text-grape"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-full border border-oak/30 px-3 py-1 text-plum/30">Previous</span>
      )}

      <span className="text-plum/70">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={hrefForPage(currentPage + 1, query)}
          className="rounded-full border border-oak/60 bg-white px-3 py-1 text-plum transition hover:border-grape hover:text-grape"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-full border border-oak/30 px-3 py-1 text-plum/30">Next</span>
      )}
    </div>
  );
}
