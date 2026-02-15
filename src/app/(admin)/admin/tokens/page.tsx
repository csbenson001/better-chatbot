"use client";

import { useState, useEffect, useCallback } from "react";

type UsageSummaryRow = {
  model: string;
  provider: string;
  totalInput: number;
  totalOutput: number;
  totalTokens: number;
  totalCostCents: number;
  requestCount: number;
};

type UsageData = {
  summary: UsageSummaryRow[];
  totals: {
    totalInput: number;
    totalOutput: number;
    totalTokens: number;
    totalCostCents: number;
    totalRequests: number;
  };
  period: {
    start: string;
    end: string;
  };
};

const MODEL_COLORS: Record<string, string> = {
  "gpt-4": "#8b5cf6",
  "gpt-4o": "#a78bfa",
  "gpt-3.5-turbo": "#60a5fa",
  "claude-3-opus": "#f472b6",
  "claude-3-sonnet": "#fb923c",
  "claude-3-haiku": "#34d399",
  "claude-3.5-sonnet": "#f59e0b",
};

function getModelColor(model: string): string {
  const key = Object.keys(MODEL_COLORS).find((k) =>
    model.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? MODEL_COLORS[key] : "#6b7280";
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function TokensPage() {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd));
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        periodStart: new Date(startDate).toISOString(),
        periodEnd: new Date(endDate + "T23:59:59.999Z").toISOString(),
      });
      const res = await fetch(`/api/admin/tokens?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token usage",
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const maxTokens =
    data?.summary.reduce((max, r) => Math.max(max, r.totalTokens), 0) ?? 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading token usage...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Token Usage</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor AI token consumption and costs
          </p>
        </div>
        {/* Date Range Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Tokens
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {formatTokens(data.totals.totalTokens)}
              </p>
              <div className="mt-1 text-xs text-zinc-500">
                {formatTokens(data.totals.totalInput)} in /{" "}
                {formatTokens(data.totals.totalOutput)} out
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Cost
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {formatCost(data.totals.totalCostCents)}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Requests
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {data.totals.totalRequests.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Models Used
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                {data.summary.length}
              </p>
            </div>
          </div>

          {/* Bar Chart (rendered as colored divs) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">
              Usage by Model
            </h3>
            {data.summary.length > 0 ? (
              <div className="space-y-3">
                {data.summary
                  .sort((a, b) => b.totalTokens - a.totalTokens)
                  .map((row) => {
                    const pct =
                      maxTokens > 0
                        ? Math.max(
                            2,
                            Math.round((row.totalTokens / maxTokens) * 100),
                          )
                        : 0;
                    const color = getModelColor(row.model);
                    return (
                      <div key={`${row.model}-${row.provider}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm text-zinc-300">
                              {row.model}
                            </span>
                            <span className="text-xs text-zinc-600">
                              ({row.provider})
                            </span>
                          </div>
                          <span className="text-sm text-zinc-400">
                            {formatTokens(row.totalTokens)} tokens
                          </span>
                        </div>
                        <div className="w-full h-5 bg-zinc-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full rounded-sm transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                              opacity: 0.7,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-8">
                No usage data for this period
              </p>
            )}
          </div>

          {/* Detailed Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400">
                Breakdown by Model
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Input Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Output Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Total Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Requests
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.summary
                    .sort((a, b) => b.totalTokens - a.totalTokens)
                    .map((row) => (
                      <tr
                        key={`${row.model}-${row.provider}`}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{
                                backgroundColor: getModelColor(row.model),
                              }}
                            />
                            <span className="text-sm font-medium text-zinc-200">
                              {row.model}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          {row.provider}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300 text-right font-mono">
                          {row.totalInput.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300 text-right font-mono">
                          {row.totalOutput.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-200 text-right font-mono font-medium">
                          {row.totalTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300 text-right font-mono">
                          {formatCost(row.totalCostCents)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400 text-right font-mono">
                          {row.requestCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  {data.summary.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-zinc-500"
                      >
                        No usage data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.summary.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-zinc-700 bg-zinc-800/30">
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-sm font-medium text-zinc-300"
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-200 text-right font-mono font-medium">
                        {data.totals.totalInput.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-200 text-right font-mono font-medium">
                        {data.totals.totalOutput.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-100 text-right font-mono font-bold">
                        {data.totals.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-100 text-right font-mono font-bold">
                        {formatCost(data.totals.totalCostCents)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-200 text-right font-mono font-medium">
                        {data.totals.totalRequests.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
