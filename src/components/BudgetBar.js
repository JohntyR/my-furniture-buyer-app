export default function BudgetBar({ balance, error }) {
  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load your real balance from the furniture shop right now.
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">Your balance</span>
        <span className="text-lg font-semibold text-gray-900">${balance.toFixed(2)}</span>
      </div>
    </div>
  );
}
