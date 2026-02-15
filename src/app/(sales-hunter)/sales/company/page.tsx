"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type {
  CompanyProfile,
  Product,
  ValueChain,
  SalesMethodology,
  ValueChainStage,
} from "app-types/company-intelligence";

type CompanyContext = {
  profile: CompanyProfile;
  products: Product[];
  valueChain: ValueChain[];
  methodologies: SalesMethodology[];
};

const VALUE_CHAIN_ORDER: ValueChainStage[] = [
  "raw-materials",
  "manufacturing",
  "processing",
  "distribution",
  "wholesale",
  "retail",
  "end-user",
  "recycling",
  "regulatory",
  "support-services",
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

type NewCompanyForm = {
  name: string;
  industry: string;
  website: string;
  description: string;
  employeeCount: string;
  annualRevenue: string;
  isClientCompany: boolean;
};

const emptyForm: NewCompanyForm = {
  name: "",
  industry: "",
  website: "",
  description: "",
  employeeCount: "",
  annualRevenue: "",
  isClientCompany: false,
};

export default function CompanyIntelligencePage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCompany, setNewCompany] = useState<NewCompanyForm>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CompanyContext | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const endpoint = search
        ? `/api/platform/company/profiles?${params.toString()}`
        : "/api/platform/company/profiles";
      const res = await fetch(endpoint);
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/platform/company/profiles/${id}`);
      if (res.ok) {
        const data: CompanyContext = await res.json();
        setDetail(data);
      }
    } catch (error) {
      console.error("Failed to fetch company detail:", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, fetchDetail]);

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: newCompany.name,
        isClientCompany: newCompany.isClientCompany,
      };
      if (newCompany.industry) body.industry = newCompany.industry;
      if (newCompany.website) body.website = newCompany.website;
      if (newCompany.description) body.description = newCompany.description;
      if (newCompany.employeeCount)
        body.employeeCount = Number(newCompany.employeeCount);
      if (newCompany.annualRevenue)
        body.annualRevenue = Number(newCompany.annualRevenue);

      const res = await fetch("/api/platform/company/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setNewCompany(emptyForm);
        setShowAddForm(false);
        fetchCompanies();
      }
    } catch (error) {
      console.error("Failed to create company:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetAsClient(id: string) {
    try {
      await fetch(`/api/platform/company/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClientCompany: true }),
      });
      fetchCompanies();
      if (selectedId === id) {
        fetchDetail(id);
      }
    } catch (error) {
      console.error("Failed to set as client:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this company?")) return;
    try {
      await fetch(`/api/platform/company/profiles/${id}`, {
        method: "DELETE",
      });
      if (selectedId === id) {
        setSelectedId(null);
      }
      fetchCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  }

  // Detail view
  if (selectedId && detail) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Companies
        </button>

        {/* Profile Header */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-zinc-100">
                  {detail.profile.name}
                </h2>
                {detail.profile.isClientCompany && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-medium text-blue-400">
                    Client Company
                  </span>
                )}
              </div>
              {detail.profile.description && (
                <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                  {detail.profile.description}
                </p>
              )}
            </div>
            {detail.profile.website && (
              <Link
                href={detail.profile.website}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {detail.profile.website}
              </Link>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Industry</p>
              <p className="text-sm text-zinc-200">
                {detail.profile.industry || "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Employees</p>
              <p className="text-sm text-zinc-200">
                {detail.profile.employeeCount
                  ? detail.profile.employeeCount.toLocaleString()
                  : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Annual Revenue</p>
              <p className="text-sm text-zinc-200">
                {detail.profile.annualRevenue
                  ? formatCurrency(detail.profile.annualRevenue)
                  : "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Founded</p>
              <p className="text-sm text-zinc-200">
                {detail.profile.foundedYear || "--"}
              </p>
            </div>
          </div>
          {detail.profile.targetMarkets.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 mb-1">Target Markets</p>
              <div className="flex flex-wrap gap-1">
                {detail.profile.targetMarkets.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {detail.profile.keyDifferentiators.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-1">Key Differentiators</p>
              <div className="flex flex-wrap gap-1">
                {detail.profile.keyDifferentiators.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {detail.profile.competitors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-1">Competitors</p>
              <div className="flex flex-wrap gap-1">
                {detail.profile.competitors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products & Services */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Products & Services
          </h3>
          {detail.products.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No products or services added yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-md border border-zinc-700 bg-zinc-800/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-100">
                      {product.name}
                    </h4>
                    <span className="inline-flex rounded-full bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-400 capitalize">
                      {product.type}
                    </span>
                  </div>
                  {product.description && (
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {product.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.features.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="inline-flex rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-300"
                        >
                          {f}
                        </span>
                      ))}
                      {product.features.length > 4 && (
                        <span className="text-xs text-zinc-500">
                          +{product.features.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Value Chain Visualization */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Value Chain
          </h3>
          {detail.valueChain.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No value chain entries added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Stage progression bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {VALUE_CHAIN_ORDER.filter((stage) =>
                  detail.valueChain.some((vc) => vc.stage === stage),
                ).map((stage, idx, arr) => {
                  const entry = detail.valueChain.find(
                    (vc) => vc.stage === stage,
                  )!;
                  return (
                    <React.Fragment key={stage}>
                      <div className="flex-shrink-0 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-center min-w-[120px]">
                        <p className="text-xs font-medium text-cyan-400 capitalize">
                          {stage.replace(/-/g, " ")}
                        </p>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          {entry.name}
                        </p>
                      </div>
                      {idx < arr.length - 1 && (
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
                  );
                })}
              </div>
              {/* Detailed cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {detail.valueChain.map((vc) => (
                  <div
                    key={vc.id}
                    className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-zinc-100">
                        {vc.name}
                      </h4>
                      <span className="text-xs text-cyan-400 capitalize">
                        {vc.stage.replace(/-/g, " ")}
                      </span>
                    </div>
                    {vc.description && (
                      <p className="mt-1 text-xs text-zinc-400">
                        {vc.description}
                      </p>
                    )}
                    {vc.painPoints.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-zinc-500 mb-1">
                          Pain Points
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {vc.painPoints.map((pp) => (
                            <span
                              key={pp}
                              className="inline-flex rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400"
                            >
                              {pp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {vc.opportunities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-zinc-500 mb-1">
                          Opportunities
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {vc.opportunities.map((o) => (
                            <span
                              key={o}
                              className="inline-flex rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400"
                            >
                              {o}
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
        </div>

        {/* Sales Methodology */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Sales Methodology
          </h3>
          {detail.methodologies.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No sales methodologies added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {detail.methodologies.map((m) => {
                const stages = m.stages as Array<{
                  name?: string;
                  description?: string;
                  activities?: string[];
                  exitCriteria?: string[];
                  typicalDuration?: string;
                }>;
                return (
                  <div
                    key={m.id}
                    className="rounded-md border border-zinc-700 bg-zinc-800/50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-zinc-100">
                        {m.name}
                      </h4>
                      {m.framework && (
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          {m.framework}
                        </span>
                      )}
                    </div>
                    {stages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-zinc-500 mb-2">
                          Sales Stages
                        </p>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {stages.map((s, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex-shrink-0 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center min-w-[100px]">
                                <p className="text-xs font-medium text-amber-400">
                                  {s.name}
                                </p>
                                {s.typicalDuration && (
                                  <p className="text-xs text-zinc-500 mt-0.5">
                                    {s.typicalDuration}
                                  </p>
                                )}
                              </div>
                              {idx < stages.length - 1 && (
                                <svg
                                  className="w-4 h-4 text-zinc-600 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                  />
                                </svg>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail loading state
  if (selectedId && detailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Loading company details...</p>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header / Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <div className="flex-1" />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showAddForm ? "Cancel" : "Add Company"}
        </button>
      </div>

      {/* Add Company Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddCompany}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            New Company Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={newCompany.name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={newCompany.industry}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, industry: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Website
              </label>
              <input
                type="url"
                value={newCompany.website}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, website: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Employees
              </label>
              <input
                type="number"
                min="0"
                value={newCompany.employeeCount}
                onChange={(e) =>
                  setNewCompany({
                    ...newCompany,
                    employeeCount: e.target.value,
                  })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Annual Revenue ($)
              </label>
              <input
                type="number"
                min="0"
                value={newCompany.annualRevenue}
                onChange={(e) =>
                  setNewCompany({
                    ...newCompany,
                    annualRevenue: e.target.value,
                  })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCompany.isClientCompany}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      isClientCompany: e.target.checked,
                    })
                  }
                  className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                This is the client company
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-zinc-400 mb-1">
                Description
              </label>
              <textarea
                value={newCompany.description}
                onChange={(e) =>
                  setNewCompany({
                    ...newCompany,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {submitting ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      )}

      {/* Company Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse mb-3" />
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500">
            No companies found. Add a company to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => setSelectedId(company.id)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">
                      {company.name}
                    </h3>
                    {company.isClientCompany && (
                      <span className="flex-shrink-0 inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                        Client
                      </span>
                    )}
                  </div>
                  {company.industry && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {company.industry}
                      {company.subIndustry ? ` / ${company.subIndustry}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {company.annualRevenue && (
                  <div>
                    <p className="text-xs text-zinc-500">Revenue</p>
                    <p className="text-sm text-zinc-200">
                      {formatCurrency(company.annualRevenue)}
                    </p>
                  </div>
                )}
                {company.employeeCount && (
                  <div>
                    <p className="text-xs text-zinc-500">Employees</p>
                    <p className="text-sm text-zinc-200">
                      {company.employeeCount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {company.website && (
                <p className="mt-2 text-xs text-blue-400 truncate">
                  {company.website}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
                {!company.isClientCompany && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsClient(company.id);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Set as Client
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(company.id);
                  }}
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
