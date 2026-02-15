"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type FilingRecord = {
  id: string;
  tenantId: string;
  sourceId: string;
  prospectId: string | null;
  externalId: string;
  filingType: string;
  title: string;
  description: string | null;
  filingDate: string;
  filingUrl: string | null;
  facilityName: string | null;
  facilityId: string | null;
  state: string | null;
  county: string | null;
  regulatoryProgram: string | null;
  companyName: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rawData: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const STATES = ["TX", "CO", "WY", "KS", "UT", "CA", "NM"];

const FILING_TYPE_COLORS: Record<string, string> = {
  permit: "bg-blue-500/20 text-blue-400",
  "permit-renewal": "bg-cyan-500/20 text-cyan-400",
  violation: "bg-red-500/20 text-red-400",
  inspection: "bg-amber-500/20 text-amber-400",
  complaint: "bg-orange-500/20 text-orange-400",
  enforcement: "bg-rose-500/20 text-rose-400",
  registration: "bg-emerald-500/20 text-emerald-400",
  application: "bg-indigo-500/20 text-indigo-400",
  amendment: "bg-purple-500/20 text-purple-400",
  notice: "bg-teal-500/20 text-teal-400",
};

function getFilingTypeColor(filingType: string): string {
  const key = Object.keys(FILING_TYPE_COLORS).find((k) =>
    filingType.toLowerCase().includes(k),
  );
  return key ? FILING_TYPE_COLORS[key] : "bg-zinc-500/20 text-zinc-400";
}

function formatDate(date: string | Date | null): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FilingsPage() {
  const [filings, setFilings] = useState<FilingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState("");
  const [filingTypeFilter, setFilingTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchFilings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      if (filingTypeFilter) params.set("filingType", filingTypeFilter);
      if (sourceFilter) params.set("sourceId", sourceFilter);
      params.set("limit", String(limit));
      params.set("offset", String((page - 1) * limit));

      const res = await fetch(`/api/sales-hunter/filings?${params.toString()}`);
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Failed to fetch filing records");
      setFilings(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch filing records",
      );
    } finally {
      setLoading(false);
    }
  }, [stateFilter, filingTypeFilter, sourceFilter, page]);

  useEffect(() => {
    fetchFilings();
  }, [fetchFilings]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Collect unique filing types from data for filter dropdown
  const filingTypes = Array.from(
    new Set(filings.map((f) => f.filingType).filter(Boolean)),
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Filing Records</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse and filter regulatory filing records from public data
            sources.
          </p>
        </div>
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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filingTypeFilter}
          onChange={(e) => {
            setFilingTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Filing Types</option>
          {filingTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by source ID..."
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />

        {(stateFilter || filingTypeFilter || sourceFilter) && (
          <button
            onClick={() => {
              setStateFilter("");
              setFilingTypeFilter("");
              setSourceFilter("");
              setPage(1);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filings Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">
            Loading filing records...
          </div>
        ) : filings.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="mb-2">No filing records found.</p>
            <p className="text-sm">
              Try adjusting your filters or check that data sources are
              configured.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium w-8"></th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Facility</th>
                  <th className="px-4 py-3 text-left font-medium">State</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Filing Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Prospect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filings.map((filing) => {
                  const isExpanded = expandedIds.has(filing.id);
                  return (
                    <React.Fragment key={filing.id}>
                      <tr
                        className="text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpanded(filing.id)}
                      >
                        <td className="px-4 py-3 text-zinc-500">
                          <span
                            className={`inline-block transition-transform duration-150 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          >
                            &#9654;
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-medium text-zinc-100 line-clamp-1"
                            title={filing.title}
                          >
                            {filing.title}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${getFilingTypeColor(
                              filing.filingType,
                            )}`}
                          >
                            {filing.filingType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">
                          {filing.facilityName || "--"}
                        </td>
                        <td className="px-4 py-3">
                          {filing.state ? (
                            <span className="inline-flex rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 border border-zinc-700 font-mono">
                              {filing.state}
                            </span>
                          ) : (
                            <span className="text-zinc-500">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">
                          {formatDate(filing.filingDate)}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">
                          {filing.companyName || "--"}
                        </td>
                        <td className="px-4 py-3">
                          {filing.contactName || filing.contactEmail ? (
                            <div>
                              {filing.contactName && (
                                <div className="text-xs text-zinc-300">
                                  {filing.contactName}
                                </div>
                              )}
                              {filing.contactEmail && (
                                <a
                                  href={`mailto:${filing.contactEmail}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  {filing.contactEmail}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-xs">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {filing.prospectId ? (
                            <Link
                              href={`/sales/prospects?id=${filing.prospectId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                            >
                              View Prospect
                            </Link>
                          ) : (
                            <span className="text-zinc-500 text-xs">--</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-zinc-800/30">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Left Column - Filing Details */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-zinc-200">
                                  Filing Details
                                </h4>

                                {filing.description && (
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                      Description
                                    </label>
                                    <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
                                      {filing.description}
                                    </p>
                                  </div>
                                )}

                                {filing.filingUrl && (
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                      Filing URL
                                    </label>
                                    <p className="mt-1">
                                      <a
                                        href={filing.filingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-400 hover:text-blue-300 break-all"
                                      >
                                        {filing.filingUrl}
                                      </a>
                                    </p>
                                  </div>
                                )}

                                {filing.regulatoryProgram && (
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                      Regulatory Program
                                    </label>
                                    <p className="mt-1 text-sm text-zinc-300">
                                      {filing.regulatoryProgram}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                      External ID
                                    </label>
                                    <p className="mt-1 text-sm text-zinc-400 font-mono">
                                      {filing.externalId}
                                    </p>
                                  </div>
                                  {filing.facilityId && (
                                    <div>
                                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Facility ID
                                      </label>
                                      <p className="mt-1 text-sm text-zinc-400 font-mono">
                                        {filing.facilityId}
                                      </p>
                                    </div>
                                  )}
                                  {filing.county && (
                                    <div>
                                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        County
                                      </label>
                                      <p className="mt-1 text-sm text-zinc-300">
                                        {filing.county}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                      Source ID
                                    </label>
                                    <p className="mt-1 text-sm text-zinc-400 font-mono text-xs break-all">
                                      {filing.sourceId}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column - Contact & Raw Data */}
                              <div className="space-y-3">
                                {/* Contact Info */}
                                {(filing.contactName ||
                                  filing.contactEmail ||
                                  filing.contactPhone ||
                                  filing.contactTitle) && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                                      Contact Information
                                    </h4>
                                    <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 space-y-1">
                                      {filing.contactName && (
                                        <p className="text-sm text-zinc-200">
                                          {filing.contactName}
                                        </p>
                                      )}
                                      {filing.contactTitle && (
                                        <p className="text-xs text-zinc-400">
                                          {filing.contactTitle}
                                        </p>
                                      )}
                                      {filing.contactEmail && (
                                        <p className="text-xs">
                                          <a
                                            href={`mailto:${filing.contactEmail}`}
                                            className="text-blue-400 hover:text-blue-300"
                                          >
                                            {filing.contactEmail}
                                          </a>
                                        </p>
                                      )}
                                      {filing.contactPhone && (
                                        <p className="text-xs text-zinc-400">
                                          {filing.contactPhone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Raw Data */}
                                {Object.keys(filing.rawData).length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                                      Raw Data
                                    </h4>
                                    <pre className="bg-zinc-900 border border-zinc-700 rounded-md p-3 text-xs text-zinc-400 overflow-x-auto max-h-48 overflow-y-auto">
                                      {JSON.stringify(filing.rawData, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Metadata */}
                                {Object.keys(filing.metadata).length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                                      Metadata
                                    </h4>
                                    <pre className="bg-zinc-900 border border-zinc-700 rounded-md p-3 text-xs text-zinc-400 overflow-x-auto max-h-32 overflow-y-auto">
                                      {JSON.stringify(filing.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filings.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              Page {page} &middot; {filings.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 disabled:opacity-50 hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={filings.length < limit}
                className="px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 disabled:opacity-50 hover:bg-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
