export default function BudgetBar({ balance, error }) {
  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load your real balance from the furniture shop right now.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-oak/50 bg-gradient-to-r from-grape to-plum p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-white/80">Your balance</span>
        <span className="text-2xl font-semibold text-white">${balance.toFixed(2)}</span>
      </div>
    </div>
  );
}
