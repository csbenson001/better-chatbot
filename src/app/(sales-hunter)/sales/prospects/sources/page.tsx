"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ProspectSource, ProspectSourceType } from "app-types/prospecting";

const ALL_SOURCE_TYPES: ProspectSourceType[] = [
  "epa-echo",
  "epa-tri",
  "sec-edgar",
  "state-permit",
  "federal-filing",
  "county-records",
  "business-registry",
  "trade-association",
  "web-scrape",
  "industry-directory",
  "government-contract",
  "import-export-records",
];

const SOURCE_TYPE_LABELS: Record<ProspectSourceType, string> = {
  "epa-echo": "EPA ECHO",
  "epa-tri": "EPA TRI",
  "sec-edgar": "SEC EDGAR",
  "state-permit": "State Permit",
  "federal-filing": "Federal Filing",
  "county-records": "County Records",
  "business-registry": "Business Registry",
  "trade-association": "Trade Association",
  "web-scrape": "Web Scrape",
  "industry-directory": "Industry Directory",
  "government-contract": "Government Contract",
  "import-export-records": "Import/Export Records",
};

const SOURCE_TYPE_COLORS: Record<ProspectSourceType, string> = {
  "epa-echo": "bg-emerald-500/20 text-emerald-400",
  "epa-tri": "bg-green-500/20 text-green-400",
  "sec-edgar": "bg-blue-500/20 text-blue-400",
  "state-permit": "bg-amber-500/20 text-amber-400",
  "federal-filing": "bg-indigo-500/20 text-indigo-400",
  "county-records": "bg-orange-500/20 text-orange-400",
  "business-registry": "bg-cyan-500/20 text-cyan-400",
  "trade-association": "bg-purple-500/20 text-purple-400",
  "web-scrape": "bg-pink-500/20 text-pink-400",
  "industry-directory": "bg-teal-500/20 text-teal-400",
  "government-contract": "bg-sky-500/20 text-sky-400",
  "import-export-records": "bg-rose-500/20 text-rose-400",
};

function formatDate(date: string | Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type NewSourceForm = {
  name: string;
  type: ProspectSourceType;
  baseUrl: string;
  apiEndpoint: string;
  schedule: string;
  enabled: boolean;
};

const emptyForm: NewSourceForm = {
  name: "",
  type: "epa-echo",
  baseUrl: "",
  apiEndpoint: "",
  schedule: "",
  enabled: true,
};

export default function ProspectSourcesPage() {
  const [sources, setSources] = useState<ProspectSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSource, setNewSource] = useState<NewSourceForm>(emptyForm);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(
        `/api/sales-hunter/prospects/sources?${params.toString()}`,
      );
      const data = await res.json();
      setSources(Array.isArray(data) ? data : (data.data ?? []));
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleToggleEnabled(id: string, enabled: boolean) {
    try {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
      );
      await fetch(`/api/sales-hunter/prospects/sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    } catch (error) {
      console.error("Failed to toggle source:", error);
      fetchSources();
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: newSource.name,
        type: newSource.type,
        enabled: newSource.enabled,
      };
      if (newSource.baseUrl) body.baseUrl = newSource.baseUrl;
      if (newSource.apiEndpoint) body.apiEndpoint = newSource.apiEndpoint;
      if (newSource.schedule) body.schedule = newSource.schedule;

      const res = await fetch("/api/sales-hunter/prospects/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setNewSource(emptyForm);
        setShowAddForm(false);
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to add source:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this source?")) return;
    try {
      await fetch(`/api/sales-hunter/prospects/sources/${id}`, {
        method: "DELETE",
      });
      fetchSources();
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/sales/prospects"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Research Hub
            </Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-2xl font-bold text-zinc-100">
              Prospect Sources
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Configure the data sources used to discover and enrich prospect
            companies. These are public filings, registries, and databases that
            are scanned for new opportunities.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Source"}
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            typeFilter === ""
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
          }`}
        >
          All Types
        </button>
        {ALL_SOURCE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              typeFilter === t
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
            }`}
          >
            {SOURCE_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSource}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Add New Prospect Source
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Source Name *
              </label>
              <input
                type="text"
                required
                value={newSource.name}
                onChange={(e) =>
                  setNewSource({ ...newSource, name: e.target.value })
                }
                placeholder="e.g. Texas EPA Permits"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Source Type *
              </label>
              <select
                value={newSource.type}
                onChange={(e) =>
                  setNewSource({
                    ...newSource,
                    type: e.target.value as ProspectSourceType,
                  })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Base URL
              </label>
              <input
                type="url"
                value={newSource.baseUrl}
                onChange={(e) =>
                  setNewSource({ ...newSource, baseUrl: e.target.value })
                }
                placeholder="https://example.gov/data"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={newSource.apiEndpoint}
                onChange={(e) =>
                  setNewSource({ ...newSource, apiEndpoint: e.target.value })
                }
                placeholder="/api/v1/facilities"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Schedule (cron)
              </label>
              <input
                type="text"
                value={newSource.schedule}
                onChange={(e) =>
                  setNewSource({ ...newSource, schedule: e.target.value })
                }
                placeholder="0 0 * * 1 (weekly)"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSource.enabled}
                  onChange={(e) =>
                    setNewSource({ ...newSource, enabled: e.target.checked })
                  }
                  className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                Enabled
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {submitting ? "Adding..." : "Add Source"}
            </button>
          </div>
        </form>
      )}

      {/* Sources List */}
      {loading ? (
        <div className="text-center py-8 text-zinc-400">Loading sources...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="mb-2">No prospect sources configured yet.</p>
          <p className="text-sm">
            Click &quot;Add Source&quot; to configure a new data source for
            prospect discovery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        SOURCE_TYPE_COLORS[source.type] ||
                        "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {SOURCE_TYPE_LABELS[source.type] || source.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-100">
                    {source.name}
                  </h3>
                </div>
                <button
                  onClick={() =>
                    handleToggleEnabled(source.id, !source.enabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    source.enabled ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      source.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {source.baseUrl && (
                <div className="mt-2">
                  <a
                    href={source.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 break-all transition-colors"
                  >
                    {source.baseUrl}
                  </a>
                </div>
              )}

              {source.apiEndpoint && (
                <p className="mt-1 text-xs text-zinc-500 font-mono">
                  {source.apiEndpoint}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                {source.schedule && <span>Schedule: {source.schedule}</span>}
                <span>Last Scan: {formatDate(source.lastScanAt)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end border-t border-zinc-800 pt-3">
                <button
                  onClick={() => handleDelete(source.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
