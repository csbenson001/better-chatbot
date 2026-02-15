"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Industry } from "app-types/industry";

type ValueChainStage = {
  stage: string;
  name: string;
  description?: string;
  typicalPlayers?: string[];
};

type DataSource = {
  name: string;
  url?: string;
  type: string;
  description?: string;
};

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SalesIndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchIndustries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/industries");
      const data = await res.json();
      setIndustries(Array.isArray(data) ? data : (data.data ?? []));
    } catch (error) {
      console.error("Failed to fetch industries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/platform/industries/seed", {
        method: "POST",
      });
      const data = await res.json();
      setSeedResult(data.message || "Industries seeded successfully.");
      fetchIndustries();
    } catch (error) {
      console.error("Failed to seed industries:", error);
      setSeedResult("Failed to seed industries.");
    } finally {
      setSeeding(false);
    }
  }

  const filteredIndustries = industries.filter((ind) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ind.name.toLowerCase().includes(q) ||
      (ind.description || "").toLowerCase().includes(q) ||
      ind.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Industry Knowledge Base
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore industry definitions, value chains, regulatory bodies, and
            data sources to inform your sales research.
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {seeding ? "Seeding..." : "Seed Industries"}
        </button>
      </div>

      {/* Seed Result */}
      {seedResult && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center justify-between">
          <span>{seedResult}</span>
          <button
            onClick={() => setSeedResult(null)}
            className="text-emerald-400 hover:text-emerald-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search industries by name, description, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Industry Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredIndustries.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500 mb-2">No industries found.</p>
          <p className="text-sm text-zinc-500">
            Click &quot;Seed Industries&quot; to load the default industry
            knowledge base.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIndustries.map((industry) => {
            const isExpanded = expandedId === industry.id;
            const valueChain =
              (industry.valueChainTemplate as unknown as ValueChainStage[]) ||
              [];
            const dataSources =
              (industry.dataSources as unknown as DataSource[]) || [];

            return (
              <div
                key={industry.id}
                className={`rounded-lg border bg-zinc-900 transition-colors ${
                  isExpanded
                    ? "border-blue-500/50 col-span-1 md:col-span-2 lg:col-span-3"
                    : "border-zinc-800 hover:border-zinc-700 cursor-pointer"
                }`}
                onClick={() => {
                  if (!isExpanded) setExpandedId(industry.id);
                }}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-zinc-100">
                        {industry.name}
                      </h3>
                      {industry.description && (
                        <p
                          className={`text-sm text-zinc-400 mt-1 ${
                            isExpanded ? "" : "line-clamp-2"
                          }`}
                        >
                          {industry.description}
                        </p>
                      )}
                    </div>
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 ml-4 text-xl leading-none"
                      >
                        x
                      </button>
                    )}
                  </div>

                  {/* Tags / Keywords */}
                  {industry.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {industry.keywords
                        .slice(0, isExpanded ? undefined : 5)
                        .map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 border border-zinc-700"
                          >
                            {kw}
                          </span>
                        ))}
                      {!isExpanded && industry.keywords.length > 5 && (
                        <span className="text-xs text-zinc-500">
                          +{industry.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                    {industry.naicsCodes.length > 0 && (
                      <span>NAICS: {industry.naicsCodes.join(", ")}</span>
                    )}
                    <span>
                      {valueChain.length} value chain stage
                      {valueChain.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {dataSources.length} data source
                      {dataSources.length !== 1 ? "s" : ""}
                    </span>
                    {industry.regulatoryBodies.length > 0 && (
                      <span>
                        {industry.regulatoryBodies.length} regulatory bod
                        {industry.regulatoryBodies.length !== 1 ? "ies" : "y"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 p-5 space-y-6">
                    {/* NAICS / SIC Codes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {industry.naicsCodes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2">
                            NAICS Codes
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {industry.naicsCodes.map((code) => (
                              <span
                                key={code}
                                className="inline-flex rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {industry.sicCodes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2">
                            SIC Codes
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {industry.sicCodes.map((code) => (
                              <span
                                key={code}
                                className="inline-flex rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Regulatory Bodies */}
                    {industry.regulatoryBodies.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2">
                          Regulatory Bodies
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {industry.regulatoryBodies.map((body) => (
                            <span
                              key={body}
                              className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400"
                            >
                              {body}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value Chain */}
                    {valueChain.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-zinc-500 uppercase mb-3">
                          Value Chain
                        </h4>
                        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3">
                          {valueChain.map((stage, idx) => (
                            <React.Fragment key={stage.stage}>
                              <div className="flex-shrink-0 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center min-w-[120px]">
                                <p className="text-xs font-medium text-cyan-400">
                                  {formatSlug(stage.stage)}
                                </p>
                                <p className="text-xs text-zinc-300 mt-0.5">
                                  {stage.name}
                                </p>
                              </div>
                              {idx < valueChain.length - 1 && (
                                <svg
                                  className="w-5 h-5 text-zinc-600 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {valueChain.map((stage) => (
                            <div
                              key={stage.stage}
                              className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                            >
                              <h5 className="text-sm font-medium text-zinc-100">
                                {stage.name}
                              </h5>
                              <p className="text-xs text-cyan-400 mb-1">
                                {formatSlug(stage.stage)}
                              </p>
                              {stage.description && (
                                <p className="text-xs text-zinc-400 mt-1">
                                  {stage.description}
                                </p>
                              )}
                              {stage.typicalPlayers &&
                                stage.typicalPlayers.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-zinc-500 mb-1">
                                      Typical Players
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {stage.typicalPlayers.map((p) => (
                                        <span
                                          key={p}
                                          className="inline-flex rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-300"
                                        >
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data Sources */}
                    {dataSources.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2">
                          Data Sources
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dataSources.map((ds, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                            >
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-medium text-zinc-100">
                                  {ds.name}
                                </h5>
                                <span className="inline-flex rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium text-teal-400">
                                  {ds.type}
                                </span>
                              </div>
                              {ds.description && (
                                <p className="text-xs text-zinc-400 mt-1">
                                  {ds.description}
                                </p>
                              )}
                              {ds.url && (
                                <a
                                  href={ds.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 block break-all"
                                >
                                  {ds.url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
