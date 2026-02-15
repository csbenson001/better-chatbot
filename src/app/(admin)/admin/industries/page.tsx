"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Industry, IndustryDocument } from "app-types/industry";

type ValueChainStageInput = {
  stage: string;
  name: string;
  description: string;
  typicalPlayers: string;
};

type DataSourceInput = {
  name: string;
  url: string;
  type: string;
  description: string;
};

type IndustryForm = {
  name: string;
  slug: string;
  description: string;
  naicsCodes: string;
  sicCodes: string;
  keywords: string;
  regulatoryBodies: string;
  valueChainTemplate: ValueChainStageInput[];
  dataSources: DataSourceInput[];
};

const emptyForm: IndustryForm = {
  name: "",
  slug: "",
  description: "",
  naicsCodes: "",
  sicCodes: "",
  keywords: "",
  regulatoryBodies: "",
  valueChainTemplate: [],
  dataSources: [],
};

const emptyStage: ValueChainStageInput = {
  stage: "",
  name: "",
  description: "",
  typicalPlayers: "",
};

const emptyDataSource: DataSourceInput = {
  name: "",
  url: "",
  type: "",
  description: "",
};

function splitTrimFilter(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminIndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<IndustryForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [docsMap, setDocsMap] = useState<Record<string, IndustryDocument[]>>(
    {},
  );
  const [expandedDocs, setExpandedDocs] = useState<string | null>(null);

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

  async function fetchDocs(industryId: string) {
    try {
      const res = await fetch(
        `/api/platform/industries/${industryId}/documents`,
      );
      const data = await res.json();
      setDocsMap((prev) => ({
        ...prev,
        [industryId]: Array.isArray(data) ? data : (data.data ?? []),
      }));
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }

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
      console.error("Failed to seed:", error);
      setSeedResult("Failed to seed industries.");
    } finally {
      setSeeding(false);
    }
  }

  function populateFormFromIndustry(industry: Industry) {
    const vcTemplate = (
      industry.valueChainTemplate as Array<{
        stage?: string;
        name?: string;
        description?: string;
        typicalPlayers?: string[];
      }>
    ).map((s) => ({
      stage: s.stage || "",
      name: s.name || "",
      description: s.description || "",
      typicalPlayers: (s.typicalPlayers || []).join(", "),
    }));

    const dsInput = (
      industry.dataSources as Array<{
        name?: string;
        url?: string;
        type?: string;
        description?: string;
      }>
    ).map((d) => ({
      name: d.name || "",
      url: d.url || "",
      type: d.type || "",
      description: d.description || "",
    }));

    setForm({
      name: industry.name,
      slug: industry.slug,
      description: industry.description || "",
      naicsCodes: industry.naicsCodes.join(", "),
      sicCodes: industry.sicCodes.join(", "),
      keywords: industry.keywords.join(", "),
      regulatoryBodies: industry.regulatoryBodies.join(", "),
      valueChainTemplate: vcTemplate,
      dataSources: dsInput,
    });
  }

  function handleEdit(industry: Industry) {
    setEditingId(industry.id);
    setShowAddForm(false);
    populateFormFromIndustry(industry);
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
    return {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      naicsCodes: splitTrimFilter(form.naicsCodes),
      sicCodes: splitTrimFilter(form.sicCodes),
      keywords: splitTrimFilter(form.keywords),
      regulatoryBodies: splitTrimFilter(form.regulatoryBodies),
      valueChainTemplate: form.valueChainTemplate
        .filter((s) => s.stage && s.name)
        .map((s) => ({
          stage: s.stage,
          name: s.name,
          description: s.description || undefined,
          typicalPlayers: splitTrimFilter(s.typicalPlayers),
        })),
      dataSources: form.dataSources
        .filter((d) => d.name && d.type)
        .map((d) => ({
          name: d.name,
          url: d.url || undefined,
          type: d.type,
          description: d.description || undefined,
        })),
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = buildRequestBody();
      const url = editingId
        ? `/api/platform/industries/${editingId}`
        : "/api/platform/industries";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        handleCancelEdit();
        fetchIndustries();
      }
    } catch (error) {
      console.error("Failed to save industry:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this industry?")) return;
    try {
      await fetch(`/api/platform/industries/${id}`, { method: "DELETE" });
      if (editingId === id) handleCancelEdit();
      fetchIndustries();
    } catch (error) {
      console.error("Failed to delete industry:", error);
    }
  }

  function addValueChainStage() {
    setForm({
      ...form,
      valueChainTemplate: [...form.valueChainTemplate, { ...emptyStage }],
    });
  }

  function removeValueChainStage(idx: number) {
    setForm({
      ...form,
      valueChainTemplate: form.valueChainTemplate.filter((_, i) => i !== idx),
    });
  }

  function updateStage(
    idx: number,
    field: keyof ValueChainStageInput,
    value: string,
  ) {
    const updated = [...form.valueChainTemplate];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, valueChainTemplate: updated });
  }

  function addDataSource() {
    setForm({
      ...form,
      dataSources: [...form.dataSources, { ...emptyDataSource }],
    });
  }

  function removeDataSource(idx: number) {
    setForm({
      ...form,
      dataSources: form.dataSources.filter((_, i) => i !== idx),
    });
  }

  function updateDataSource(
    idx: number,
    field: keyof DataSourceInput,
    value: string,
  ) {
    const updated = [...form.dataSources];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, dataSources: updated });
  }

  const isEditing = editingId !== null || showAddForm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Industries Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create and manage industry definitions, value chains, and data
            source configurations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-sm px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Seeding..." : "Seed Industries"}
          </button>
          <button
            onClick={isEditing ? handleCancelEdit : handleStartAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {isEditing ? "Cancel" : "Add Industry"}
          </button>
        </div>
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

      {/* Edit / Add Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100">
            {editingId ? "Edit Industry" : "New Industry"}
          </h3>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. chemical-distribution"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                NAICS Codes (comma separated)
              </label>
              <input
                type="text"
                value={form.naicsCodes}
                onChange={(e) =>
                  setForm({ ...form, naicsCodes: e.target.value })
                }
                placeholder="325, 3251"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                SIC Codes (comma separated)
              </label>
              <input
                type="text"
                value={form.sicCodes}
                onChange={(e) => setForm({ ...form, sicCodes: e.target.value })}
                placeholder="2819, 2899"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="chemicals, solvents, reagents"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Regulatory Bodies (comma separated)
              </label>
              <input
                type="text"
                value={form.regulatoryBodies}
                onChange={(e) =>
                  setForm({ ...form, regulatoryBodies: e.target.value })
                }
                placeholder="EPA, OSHA, DOT"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          </div>

          {/* Value Chain Template */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-zinc-300">
                Value Chain Template
              </h4>
              <button
                type="button"
                onClick={addValueChainStage}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                + Add Stage
              </button>
            </div>
            {form.valueChainTemplate.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No value chain stages. Click &quot;+ Add Stage&quot; to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {form.valueChainTemplate.map((stage, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Stage ID *
                        </label>
                        <input
                          type="text"
                          value={stage.stage}
                          onChange={(e) =>
                            updateStage(idx, "stage", e.target.value)
                          }
                          placeholder="raw-materials"
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) =>
                            updateStage(idx, "name", e.target.value)
                          }
                          placeholder="Raw Materials Sourcing"
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={stage.description}
                          onChange={(e) =>
                            updateStage(idx, "description", e.target.value)
                          }
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-zinc-500 mb-1">
                            Typical Players
                          </label>
                          <input
                            type="text"
                            value={stage.typicalPlayers}
                            onChange={(e) =>
                              updateStage(idx, "typicalPlayers", e.target.value)
                            }
                            placeholder="comma separated"
                            className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeValueChainStage(idx)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium pb-1.5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-zinc-300">
                Data Sources
              </h4>
              <button
                type="button"
                onClick={addDataSource}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                + Add Data Source
              </button>
            </div>
            {form.dataSources.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No data sources. Click &quot;+ Add Data Source&quot; to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {form.dataSources.map((ds, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={ds.name}
                          onChange={(e) =>
                            updateDataSource(idx, "name", e.target.value)
                          }
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Type *
                        </label>
                        <input
                          type="text"
                          value={ds.type}
                          onChange={(e) =>
                            updateDataSource(idx, "type", e.target.value)
                          }
                          placeholder="database, api, report"
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          URL
                        </label>
                        <input
                          type="text"
                          value={ds.url}
                          onChange={(e) =>
                            updateDataSource(idx, "url", e.target.value)
                          }
                          className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-zinc-500 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={ds.description}
                            onChange={(e) =>
                              updateDataSource(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDataSource(idx)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium pb-1.5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
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
                  ? "Update Industry"
                  : "Create Industry"}
            </button>
          </div>
        </form>
      )}

      {/* Industries List */}
      {loading ? (
        <div className="text-center py-8 text-zinc-400">
          Loading industries...
        </div>
      ) : industries.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500 mb-2">No industries defined yet.</p>
          <p className="text-sm text-zinc-500">
            Click &quot;Seed Industries&quot; to load defaults, or &quot;Add
            Industry&quot; to create one manually.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Slug</th>
                  <th className="px-4 py-3 text-left font-medium">
                    NAICS Codes
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Keywords</th>
                  <th className="px-4 py-3 text-center font-medium">
                    Value Chain
                  </th>
                  <th className="px-4 py-3 text-center font-medium">
                    Data Sources
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {industries.map((industry) => {
                  const vcCount = (industry.valueChainTemplate || []).length;
                  const dsCount = (industry.dataSources || []).length;
                  const docs = docsMap[industry.id];
                  const isDocsExpanded = expandedDocs === industry.id;

                  return (
                    <React.Fragment key={industry.id}>
                      <tr className="text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-100">
                            {industry.name}
                          </div>
                          {industry.description && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                              {industry.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                          {industry.slug}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {industry.naicsCodes.slice(0, 3).map((code) => (
                              <span
                                key={code}
                                className="inline-flex rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400"
                              >
                                {code}
                              </span>
                            ))}
                            {industry.naicsCodes.length > 3 && (
                              <span className="text-xs text-zinc-500">
                                +{industry.naicsCodes.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {industry.keywords.slice(0, 3).map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 border border-zinc-700"
                              >
                                {kw}
                              </span>
                            ))}
                            {industry.keywords.length > 3 && (
                              <span className="text-xs text-zinc-500">
                                +{industry.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-400">
                          {vcCount}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-400">
                          {dsCount}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">
                          {formatDate(industry.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                if (isDocsExpanded) {
                                  setExpandedDocs(null);
                                } else {
                                  setExpandedDocs(industry.id);
                                  if (!docs) fetchDocs(industry.id);
                                }
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                            >
                              {isDocsExpanded ? "Hide Docs" : "Docs"}
                            </button>
                            <button
                              onClick={() => handleEdit(industry)}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(industry.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Documents Expanded Row */}
                      {isDocsExpanded && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-4 bg-zinc-800/30 border-b border-zinc-800"
                          >
                            <h4 className="text-sm font-medium text-zinc-300 mb-3">
                              Documents for {industry.name}
                            </h4>
                            {!docs ? (
                              <p className="text-sm text-zinc-500">
                                Loading documents...
                              </p>
                            ) : docs.length === 0 ? (
                              <p className="text-sm text-zinc-500">
                                No documents uploaded for this industry.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {docs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="inline-flex rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                                        {doc.docType}
                                      </span>
                                      <span className="text-sm text-zinc-200 truncate">
                                        {doc.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 flex-shrink-0">
                                      {doc.author && (
                                        <span>by {doc.author}</span>
                                      )}
                                      <span>{formatDate(doc.createdAt)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
