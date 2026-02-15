"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { CompanyProfile } from "app-types/company-intelligence";

type CompanyForm = {
  name: string;
  legalName: string;
  website: string;
  industry: string;
  subIndustry: string;
  naicsCode: string;
  sicCode: string;
  description: string;
  employeeCount: string;
  annualRevenue: string;
  foundedYear: string;
  stockTicker: string;
  linkedinUrl: string;
  salesMethodology: string;
  valueProposition: string;
  targetMarkets: string;
  competitors: string;
  keyDifferentiators: string;
  isClientCompany: boolean;
};

const emptyForm: CompanyForm = {
  name: "",
  legalName: "",
  website: "",
  industry: "",
  subIndustry: "",
  naicsCode: "",
  sicCode: "",
  description: "",
  employeeCount: "",
  annualRevenue: "",
  foundedYear: "",
  stockTicker: "",
  linkedinUrl: "",
  salesMethodology: "",
  valueProposition: "",
  targetMarkets: "",
  competitors: "",
  keyDifferentiators: "",
  isClientCompany: false,
};

function splitTrimFilter(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("");

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (industryFilter) params.set("industry", industryFilter);
      if (clientFilter) params.set("isClientCompany", clientFilter);
      const res = await fetch(
        `/api/platform/company/profiles?${params.toString()}`,
      );
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : (data.data ?? []));
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  }, [search, industryFilter, clientFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function populateFormFromCompany(company: CompanyProfile) {
    setForm({
      name: company.name,
      legalName: company.legalName || "",
      website: company.website || "",
      industry: company.industry || "",
      subIndustry: company.subIndustry || "",
      naicsCode: company.naicsCode || "",
      sicCode: company.sicCode || "",
      description: company.description || "",
      employeeCount: company.employeeCount?.toString() || "",
      annualRevenue: company.annualRevenue?.toString() || "",
      foundedYear: company.foundedYear?.toString() || "",
      stockTicker: company.stockTicker || "",
      linkedinUrl: company.linkedinUrl || "",
      salesMethodology: company.salesMethodology || "",
      valueProposition: company.valueProposition || "",
      targetMarkets: company.targetMarkets.join(", "),
      competitors: company.competitors.join(", "),
      keyDifferentiators: company.keyDifferentiators.join(", "),
      isClientCompany: company.isClientCompany,
    });
  }

  function handleEdit(company: CompanyProfile) {
    setEditingId(company.id);
    setShowAddForm(false);
    populateFormFromCompany(company);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setForm(emptyForm);
  }

  function handleStartAdd() {
    setEditingId(null);
    setShowAddForm(true);
    setForm(emptyForm);
  }

  function buildRequestBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      name: form.name,
      isClientCompany: form.isClientCompany,
    };
    if (form.legalName) body.legalName = form.legalName;
    if (form.website) body.website = form.website;
    if (form.industry) body.industry = form.industry;
    if (form.subIndustry) body.subIndustry = form.subIndustry;
    if (form.naicsCode) body.naicsCode = form.naicsCode;
    if (form.sicCode) body.sicCode = form.sicCode;
    if (form.description) body.description = form.description;
    if (form.employeeCount) body.employeeCount = Number(form.employeeCount);
    if (form.annualRevenue) body.annualRevenue = Number(form.annualRevenue);
    if (form.foundedYear) body.foundedYear = Number(form.foundedYear);
    if (form.stockTicker) body.stockTicker = form.stockTicker;
    if (form.linkedinUrl) body.linkedinUrl = form.linkedinUrl;
    if (form.salesMethodology) body.salesMethodology = form.salesMethodology;
    if (form.valueProposition) body.valueProposition = form.valueProposition;
    const targets = splitTrimFilter(form.targetMarkets);
    if (targets.length > 0) body.targetMarkets = targets;
    const comps = splitTrimFilter(form.competitors);
    if (comps.length > 0) body.competitors = comps;
    const diffs = splitTrimFilter(form.keyDifferentiators);
    if (diffs.length > 0) body.keyDifferentiators = diffs;
    return body;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = buildRequestBody();
      const url = editingId
        ? `/api/platform/company/profiles/${editingId}`
        : "/api/platform/company/profiles";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        handleCancelEdit();
        fetchCompanies();
      }
    } catch (error) {
      console.error("Failed to save company:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this company profile?"))
      return;
    try {
      await fetch(`/api/platform/company/profiles/${id}`, {
        method: "DELETE",
      });
      if (editingId === id) handleCancelEdit();
      fetchCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  }

  const isEditing = editingId !== null || showAddForm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Company Profiles</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage company profiles, client intelligence, and competitive
            landscape data.
          </p>
        </div>
        <button
          onClick={isEditing ? handleCancelEdit : handleStartAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {isEditing ? "Cancel" : "Add Company"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />

        <input
          type="text"
          placeholder="Filter by industry..."
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Companies</option>
          <option value="true">Client Companies</option>
          <option value="false">Non-Client</option>
        </select>

        {(search || industryFilter || clientFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setIndustryFilter("");
              setClientFilter("");
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-zinc-100">
            {editingId ? "Edit Company Profile" : "New Company Profile"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Legal Name
              </label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) =>
                  setForm({ ...form, legalName: e.target.value })
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
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Sub-Industry
              </label>
              <input
                type="text"
                value={form.subIndustry}
                onChange={(e) =>
                  setForm({ ...form, subIndustry: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                NAICS Code
              </label>
              <input
                type="text"
                value={form.naicsCode}
                onChange={(e) =>
                  setForm({ ...form, naicsCode: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                SIC Code
              </label>
              <input
                type="text"
                value={form.sicCode}
                onChange={(e) => setForm({ ...form, sicCode: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Employees
              </label>
              <input
                type="number"
                min="0"
                value={form.employeeCount}
                onChange={(e) =>
                  setForm({ ...form, employeeCount: e.target.value })
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
                value={form.annualRevenue}
                onChange={(e) =>
                  setForm({ ...form, annualRevenue: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Founded Year
              </label>
              <input
                type="number"
                min="1800"
                max="2100"
                value={form.foundedYear}
                onChange={(e) =>
                  setForm({ ...form, foundedYear: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Stock Ticker
              </label>
              <input
                type="text"
                value={form.stockTicker}
                onChange={(e) =>
                  setForm({ ...form, stockTicker: e.target.value })
                }
                placeholder="e.g. AAPL"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) =>
                  setForm({ ...form, linkedinUrl: e.target.value })
                }
                placeholder="https://linkedin.com/company/..."
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Target Markets (comma separated)
              </label>
              <input
                type="text"
                value={form.targetMarkets}
                onChange={(e) =>
                  setForm({ ...form, targetMarkets: e.target.value })
                }
                placeholder="Healthcare, Manufacturing"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Competitors (comma separated)
              </label>
              <input
                type="text"
                value={form.competitors}
                onChange={(e) =>
                  setForm({ ...form, competitors: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Key Differentiators (comma separated)
              </label>
              <input
                type="text"
                value={form.keyDifferentiators}
                onChange={(e) =>
                  setForm({ ...form, keyDifferentiators: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isClientCompany}
                  onChange={(e) =>
                    setForm({ ...form, isClientCompany: e.target.checked })
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
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-zinc-400 mb-1">
                Value Proposition
              </label>
              <textarea
                value={form.valueProposition}
                onChange={(e) =>
                  setForm({ ...form, valueProposition: e.target.value })
                }
                rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-zinc-400 mb-1">
                Sales Methodology Notes
              </label>
              <textarea
                value={form.salesMethodology}
                onChange={(e) =>
                  setForm({ ...form, salesMethodology: e.target.value })
                }
                rows={2}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update Company"
                  : "Create Company"}
            </button>
          </div>
        </form>
      )}

      {/* Company Profiles Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="mb-2">No company profiles found.</p>
            <p className="text-sm">
              Click &quot;Add Company&quot; to create a new company profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Industry</th>
                  <th className="px-4 py-3 text-left font-medium">Website</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Employees
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-center font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">
                        {company.name}
                      </div>
                      {company.legalName &&
                        company.legalName !== company.name && (
                          <p className="text-xs text-zinc-500">
                            {company.legalName}
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>{company.industry || "--"}</div>
                      {company.subIndustry && (
                        <div className="text-xs text-zinc-500">
                          {company.subIndustry}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 break-all"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <span className="text-zinc-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {company.employeeCount
                        ? company.employeeCount.toLocaleString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {company.annualRevenue
                        ? formatCurrency(company.annualRevenue)
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {company.isClientCompany ? (
                        <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                          Client
                        </span>
                      ) : (
                        <span className="text-zinc-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
