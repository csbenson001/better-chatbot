"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { StateSource } from "app-types/state-research";

const ALL_STATES = [
  { code: "TX", label: "Texas" },
  { code: "CO", label: "Colorado" },
  { code: "WY", label: "Wyoming" },
  { code: "KS", label: "Kansas" },
  { code: "UT", label: "Utah" },
  { code: "CA", label: "California" },
  { code: "NM", label: "New Mexico" },
  { code: "US", label: "Federal (US)" },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  "oil-gas-commission": "Oil & Gas Commission",
  "environmental-agency": "Environmental Agency",
  "air-quality": "Air Quality",
  "water-quality": "Water Quality",
  "waste-management": "Waste Management",
  "permits-registry": "Permits Registry",
  "enforcement-actions": "Enforcement Actions",
  "emissions-inventory": "Emissions Inventory",
  "compliance-monitoring": "Compliance Monitoring",
  "well-registry": "Well Registry",
  "production-data": "Production Data",
  "general-regulatory": "General Regulatory",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  "oil-gas-commission": "bg-blue-500/20 text-blue-400",
  "environmental-agency": "bg-emerald-500/20 text-emerald-400",
  "air-quality": "bg-cyan-500/20 text-cyan-400",
  "water-quality": "bg-sky-500/20 text-sky-400",
  "waste-management": "bg-orange-500/20 text-orange-400",
  "permits-registry": "bg-amber-500/20 text-amber-400",
  "enforcement-actions": "bg-red-500/20 text-red-400",
  "emissions-inventory": "bg-purple-500/20 text-purple-400",
  "compliance-monitoring": "bg-pink-500/20 text-pink-400",
  "well-registry": "bg-indigo-500/20 text-indigo-400",
  "production-data": "bg-teal-500/20 text-teal-400",
  "general-regulatory": "bg-zinc-500/20 text-zinc-400",
};

function formatDate(date: string | Date | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SourceCard({
  source,
  onToggle,
}: {
  source: StateSource;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                SOURCE_TYPE_COLORS[source.sourceType] ||
                "bg-zinc-500/20 text-zinc-400"
              }`}
            >
              {SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType}
            </span>
            <span className="text-xs text-zinc-500">{source.state}</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-100">{source.name}</h3>
          {source.agencyName && (
            <p className="text-xs text-zinc-400 mt-0.5">{source.agencyName}</p>
          )}
        </div>
        <button
          onClick={() => onToggle(source.id, !source.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

      <div className="mt-3">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 break-all transition-colors"
        >
          {source.url}
        </a>
      </div>

      {source.capabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {source.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span>Format: {source.dataFormat}</span>
        <span>Last Scan: {formatDate(source.lastScanAt)}</span>
      </div>
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<StateSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add source form
  const [newSource, setNewSource] = useState({
    name: "",
    state: "TX",
    sourceType: "oil-gas-commission" as string,
    agencyName: "",
    url: "",
    dataFormat: "html",
    capabilities: "",
  });

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedState) params.set("state", selectedState);
      const res = await fetch(
        `/api/platform/state-research/sources?${params.toString()}`,
      );
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/platform/state-research/sources/seed", {
        method: "POST",
      });
      const data = await res.json();
      setSeedResult(data.message);
      fetchSources();
    } catch (error) {
      console.error("Failed to seed sources:", error);
      setSeedResult("Failed to seed sources");
    } finally {
      setSeeding(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      // Update local state optimistically
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
      );

      await fetch(`/api/platform/state-research/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
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
      const res = await fetch("/api/platform/state-research/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSource,
          capabilities: newSource.capabilities
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewSource({
          name: "",
          state: "TX",
          sourceType: "oil-gas-commission",
          agencyName: "",
          url: "",
          dataFormat: "html",
          capabilities: "",
        });
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to add source:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredSources = sources;
  const stateGroups = ALL_STATES.filter((s) =>
    selectedState ? s.code === selectedState : true,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/sales/research"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Research Hub
            </Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-2xl font-bold text-zinc-100">State Sources</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Manage regulatory data sources for state-level research. These are
            the agencies, databases, and registries that research agents scan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-sm px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Seeding..." : "Seed Default Sources"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {showAddForm ? "Cancel" : "Add Source"}
          </button>
        </div>
      </div>

      {/* Seed Result */}
      {seedResult && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          {seedResult}
        </div>
      )}

      {/* State Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedState("")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            selectedState === ""
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
          }`}
        >
          All
        </button>
        {ALL_STATES.map((s) => (
          <button
            key={s.code}
            onClick={() => setSelectedState(s.code)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedState === s.code
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
            }`}
          >
            {s.code}
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
            Add New Source
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name *</label>
              <input
                type="text"
                required
                value={newSource.name}
                onChange={(e) =>
                  setNewSource({ ...newSource, name: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                State *
              </label>
              <select
                value={newSource.state}
                onChange={(e) =>
                  setNewSource({ ...newSource, state: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Source Type *
              </label>
              <select
                value={newSource.sourceType}
                onChange={(e) =>
                  setNewSource({ ...newSource, sourceType: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(SOURCE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Agency Name
              </label>
              <input
                type="text"
                value={newSource.agencyName}
                onChange={(e) =>
                  setNewSource({ ...newSource, agencyName: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">URL *</label>
              <input
                type="url"
                required
                value={newSource.url}
                onChange={(e) =>
                  setNewSource({ ...newSource, url: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Data Format
              </label>
              <select
                value={newSource.dataFormat}
                onChange={(e) =>
                  setNewSource({ ...newSource, dataFormat: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="html">HTML</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="api">API</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-zinc-400 mb-1">
                Capabilities (comma separated)
              </label>
              <input
                type="text"
                value={newSource.capabilities}
                onChange={(e) =>
                  setNewSource({
                    ...newSource,
                    capabilities: e.target.value,
                  })
                }
                placeholder="e.g. well-permits, production-data, enforcement"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
      ) : filteredSources.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="mb-3">No state sources configured yet.</p>
          <p className="text-sm">
            Click &quot;Seed Default Sources&quot; to load pre-configured
            regulatory data sources for oil &amp; gas states.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {stateGroups.map((stateInfo) => {
            const stateSources = filteredSources.filter(
              (s) => s.state === stateInfo.code,
            );
            if (stateSources.length === 0) return null;
            return (
              <div key={stateInfo.code}>
                <h2 className="text-lg font-semibold text-zinc-100 mb-3">
                  {stateInfo.label} ({stateInfo.code})
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    {stateSources.length} source
                    {stateSources.length !== 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {stateSources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
