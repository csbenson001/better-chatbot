"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Brief {
  id: string;
  title: string;
  type: string;
  status: string;
  prospectId?: string;
  companyId?: string;
  content?: string;
  createdAt: string;
}

const BRIEF_TYPES = [
  "pre-meeting",
  "executive-summary",
  "competitive-analysis",
  "account-review",
  "opportunity-assessment",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  generating: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

type NewBriefForm = {
  prospectId: string;
  companyId: string;
  type: string;
  title: string;
};

const emptyForm: NewBriefForm = {
  prospectId: "",
  companyId: "",
  type: "pre-meeting",
  title: "",
};

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewBriefForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchBriefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/briefs");
      if (res.ok) {
        const data = await res.json();
        setBriefs(data.briefs ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch briefs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: form.prospectId || undefined,
          companyId: form.companyId || undefined,
          type: form.type,
          title: form.title,
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        fetchBriefs();
      }
    } catch (error) {
      console.error("Failed to generate brief:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Sales Briefs</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Generate and manage sales intelligence briefs
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "Generate Brief"}
        </button>
      </div>

      {/* Generate Brief Form */}
      {showForm && (
        <form
          onSubmit={handleGenerate}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Generate New Brief
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Q1 Meeting Prep - Acme Corp"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Brief Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BRIEF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Prospect ID
              </label>
              <input
                type="text"
                value={form.prospectId}
                onChange={(e) =>
                  setForm({ ...form, prospectId: e.target.value })
                }
                placeholder="Optional"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Company ID
              </label>
              <input
                type="text"
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value })
                }
                placeholder="Optional"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {submitting ? "Generating..." : "Generate Brief"}
            </button>
          </div>
        </form>
      )}

      {/* Briefs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">Loading...</div>
        ) : briefs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No briefs yet. Click &quot;Generate Brief&quot; to create your first
            one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {briefs.map((brief) => (
                  <tr
                    key={brief.id}
                    className="text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {brief.title}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 capitalize">
                      {brief.type.split("-").join(" ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[brief.status] ?? "bg-zinc-500/20 text-zinc-400"}`}
                      >
                        {brief.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(brief.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
