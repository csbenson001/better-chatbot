"use client";

import { useState, useEffect, useCallback } from "react";

type ApiKey = {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type ApiKeyWithRaw = ApiKey & { rawKey?: string };

const AVAILABLE_SCOPES = [
  "read",
  "write",
  "admin",
  "agents:execute",
  "leads:read",
  "leads:write",
  "prospects:read",
  "prospects:write",
  "knowledge:read",
  "knowledge:write",
  "analytics:read",
];

function formatDate(date: string | Date | null): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>(["read"]);
  const [newRateLimit, setNewRateLimit] = useState("1000");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  // Newly created key (with raw key visible)
  const [createdKey, setCreatedKey] = useState<ApiKeyWithRaw | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/api-keys");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch API keys");
      setKeys(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  function toggleScope(scope: string) {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  function resetForm() {
    setNewName("");
    setNewScopes(["read"]);
    setNewRateLimit("1000");
    setNewExpiresAt("");
    setShowCreateForm(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        scopes: newScopes,
        userId: "00000000-0000-0000-0000-000000000000",
      };
      if (newExpiresAt) {
        body.expiresAt = new Date(newExpiresAt).toISOString();
      }
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create API key");
      setCreatedKey(json.data);
      resetForm();
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error || "Failed to revoke API key",
        );
      }
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function getKeyStatus(key: ApiKey): { label: string; colorClass: string } {
    if (key.revokedAt) {
      return { label: "Revoked", colorClass: "bg-red-500/20 text-red-400" };
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { label: "Expired", colorClass: "bg-amber-500/20 text-amber-400" };
    }
    return {
      label: "Active",
      colorClass: "bg-emerald-500/20 text-emerald-400",
    };
  }

  const activeCount = keys.filter(
    (k) =>
      !k.revokedAt && (!k.expiresAt || new Date(k.expiresAt) >= new Date()),
  ).length;
  const revokedCount = keys.filter((k) => k.revokedAt).length;

  if (loading && keys.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">API Keys</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage API keys for programmatic access to the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setCreatedKey(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Create API Key
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Newly Created Key Banner */}
      {createdKey?.rawKey && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-emerald-400">
              API Key Created Successfully
            </h3>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-zinc-400 hover:text-zinc-300 text-sm"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Copy this key now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 font-mono break-all">
              {createdKey.rawKey}
            </code>
            <button
              onClick={() => copyToClipboard(createdKey.rawKey!)}
              className={`shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Total Keys
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {keys.length}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {activeCount}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Revoked
          </p>
          <p className="mt-2 text-2xl font-semibold text-red-400">
            {revokedCount}
          </p>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">
              Create New API Key
            </h2>
            <button
              onClick={resetForm}
              className="text-zinc-400 hover:text-zinc-300 text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Scopes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors text-sm ${
                      newScopes.includes(scope)
                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="font-mono text-xs">{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rate Limit */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Rate Limit (requests/hour)
              </label>
              <input
                type="number"
                value={newRateLimit}
                onChange={(e) => setNewRateLimit(e.target.value)}
                min="1"
                max="100000"
                placeholder="1000"
                className="w-48 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Maximum number of requests allowed per hour.
              </p>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Expires At (optional)
              </label>
              <input
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
                className="w-48 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Leave blank for a non-expiring key.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md px-5 py-2 text-sm font-medium transition-colors"
              >
                {creating ? "Creating..." : "Create API Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400">All API Keys</h3>
        </div>

        {keys.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="mb-2">No API keys found.</p>
            <p className="text-sm">
              Create your first API key to enable programmatic access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Key</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Scopes</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Last Used</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {keys.map((key) => {
                  const status = getKeyStatus(key);
                  return (
                    <tr
                      key={key.id}
                      className="text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-100">
                          {key.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                          {key.keyPrefix.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.colorClass}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {key.scopes.slice(0, 3).map((scope) => (
                            <span
                              key={scope}
                              className="inline-flex rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 border border-zinc-700 font-mono"
                            >
                              {scope}
                            </span>
                          ))}
                          {key.scopes.length > 3 && (
                            <span className="text-xs text-zinc-500">
                              +{key.scopes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatDateTime(key.lastUsedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!key.revokedAt && (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
