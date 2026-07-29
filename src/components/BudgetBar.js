export default function BudgetBar({ budget, remaining }) {
  const spent = budget - remaining;
  const percentSpent = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;
  const isOverBudget = remaining < 0;

  return (
    <div className="w-full rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">Budget remaining</span>
        <span className={isOverBudget ? "font-semibold text-red-600" : "font-semibold text-gray-900"}>
          ${remaining.toFixed(2)} of ${budget.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${isOverBudget ? "bg-red-500" : "bg-gray-900"}`}
          style={{ width: `${percentSpent}%` }}
        />
      </div>
    </div>
  );
}
