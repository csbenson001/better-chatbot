"use client";

import { useState, useEffect, useCallback } from "react";

type Trial = {
  id: string;
  tenantId: string;
  plan: string;
  status: "active" | "expired" | "converted" | "canceled";
  startDate: string;
  endDate: string;
  features: Record<string, boolean>;
  maxUsers: number;
  maxAiRequests: number;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  expired: "bg-red-500/15 text-red-400",
  converted: "bg-blue-500/15 text-blue-400",
  canceled: "bg-zinc-500/15 text-zinc-400",
};

function getDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newTenantId, setNewTenantId] = useState("");
  const [newPlan, setNewPlan] = useState("professional");
  const [newDuration, setNewDuration] = useState(14);
  const [newMaxUsers, setNewMaxUsers] = useState(5);
  const [newMaxAiRequests, setNewMaxAiRequests] = useState(1000);
  const [creating, setCreating] = useState(false);

  const fetchTrials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/trials");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTrials(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  const handleCreateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: newTenantId,
          plan: newPlan,
          durationDays: newDuration,
          maxUsers: newMaxUsers,
          maxAiRequests: newMaxAiRequests,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShowCreateModal(false);
      setNewTenantId("");
      setNewPlan("professional");
      setNewDuration(14);
      setNewMaxUsers(5);
      setNewMaxAiRequests(1000);
      fetchTrials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trial");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: "active" | "expired" | "converted" | "canceled",
  ) => {
    try {
      const res = await fetch(`/api/admin/trials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update trial");
      fetchTrials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trial");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading trials...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Trials</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage trial subscriptions across tenants
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-500 transition-colors"
        >
          New Trial
        </button>
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

      {/* Trials Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  End
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {trials.map((trial) => {
                const daysRemaining = getDaysRemaining(trial.endDate);
                return (
                  <tr
                    key={trial.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-300 font-mono">
                        {trial.tenantId.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-200 font-medium capitalize">
                        {trial.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          STATUS_STYLES[trial.status]
                        }`}
                      >
                        {trial.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(trial.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(trial.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          trial.status !== "active"
                            ? "text-zinc-600"
                            : daysRemaining <= 3
                              ? "text-red-400"
                              : daysRemaining <= 7
                                ? "text-yellow-400"
                                : "text-green-400"
                        }`}
                      >
                        {trial.status === "active" ? daysRemaining : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {trial.maxUsers} users /{" "}
                      {trial.maxAiRequests.toLocaleString()} AI req
                    </td>
                    <td className="px-4 py-3 text-right">
                      {trial.status === "active" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() =>
                              handleUpdateStatus(trial.id, "converted")
                            }
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Convert
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(trial.id, "canceled")
                            }
                            className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {trials.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    No trials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trial Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Create Trial
            </h2>
            <form onSubmit={handleCreateTrial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Tenant ID
                </label>
                <input
                  type="text"
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="UUID of the tenant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Plan
                </label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    min={1}
                    max={90}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={newMaxUsers}
                    onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    AI Requests
                  </label>
                  <input
                    type="number"
                    value={newMaxAiRequests}
                    onChange={(e) =>
                      setNewMaxAiRequests(Number(e.target.value))
                    }
                    min={1}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTenantId.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Trial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
