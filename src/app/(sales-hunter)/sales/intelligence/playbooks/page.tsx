"use client";

import React, { useCallback, useEffect, useState } from "react";

interface Playbook {
  id: string;
  title: string;
  type:
    | "industry-playbook"
    | "battle-card"
    | "objection-handler"
    | "discovery-guide";
  status: "draft" | "active" | "archived";
  industry?: string;
  competitor?: string;
  content?: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  "industry-playbook": "Industry Playbook",
  "battle-card": "Battle Card",
  "objection-handler": "Objection Handler",
  "discovery-guide": "Discovery Guide",
};

const TYPE_COLORS: Record<string, string> = {
  "industry-playbook": "bg-blue-500/20 text-blue-400",
  "battle-card": "bg-red-500/20 text-red-400",
  "objection-handler": "bg-amber-500/20 text-amber-400",
  "discovery-guide": "bg-emerald-500/20 text-emerald-400",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  active: "bg-green-500/20 text-green-400",
  archived: "bg-zinc-500/20 text-zinc-400",
};

const INDUSTRIES = [
  "Manufacturing",
  "Oil & Gas",
  "Chemical",
  "Pharmaceutical",
  "Utilities",
  "Mining",
  "Waste Management",
  "Food & Beverage",
  "Pulp & Paper",
  "Automotive",
];

type TabFilter =
  | "all"
  | "industry-playbook"
  | "battle-card"
  | "objection-handler"
  | "discovery-guide";

type NewPlaybookForm = {
  type: string;
  industry: string;
  competitor: string;
  title: string;
};

const emptyForm: NewPlaybookForm = {
  type: "industry-playbook",
  industry: "",
  competitor: "",
  title: "",
};

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPlaybookForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchPlaybooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("type", tab);
      const res = await fetch(
        `/api/sales-hunter/intelligence/playbooks?${params.toString()}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPlaybooks(data.playbooks ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch playbooks:", error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          industry: form.industry || undefined,
          competitor: form.competitor || undefined,
        }),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        fetchPlaybooks();
      }
    } catch (error) {
      console.error("Failed to generate playbook:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "industry-playbook", label: "Industry Playbooks" },
    { key: "battle-card", label: "Battle Cards" },
    { key: "objection-handler", label: "Objection Handlers" },
    { key: "discovery-guide", label: "Discovery Guides" },
  ];

  const previewPlaybook = playbooks.find((p) => p.id === previewId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Playbooks &amp; Battle Cards
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Sales playbooks, battle cards, and objection handlers
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "Generate Playbook"}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <form
          onSubmit={handleGenerate}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Generate Playbook
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
                placeholder="e.g. Competitor X Battle Card"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="industry-playbook">Industry Playbook</option>
                <option value="battle-card">Battle Card</option>
                <option value="objection-handler">Objection Handler</option>
                <option value="discovery-guide">Discovery Guide</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Industry
              </label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Target Competitor
              </label>
              <input
                type="text"
                value={form.competitor}
                onChange={(e) =>
                  setForm({ ...form, competitor: e.target.value })
                }
                placeholder="Optional - competitor name"
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
              {submitting ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Playbook Grid */}
      {loading ? (
        <div className="text-center text-zinc-400 py-8">Loading...</div>
      ) : playbooks.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          No playbooks found. Generate one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playbooks.map((pb) => (
            <div
              key={pb.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-zinc-100 flex-1">
                  {pb.title}
                </h3>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[pb.status] ?? ""}`}
                >
                  {pb.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[pb.type] ?? "bg-zinc-500/20 text-zinc-400"}`}
                >
                  {TYPE_LABELS[pb.type] ?? pb.type}
                </span>
                {pb.industry && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-700/50 text-zinc-300">
                    {pb.industry}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {new Date(pb.createdAt).toLocaleDateString()}
                </span>
                {pb.content && (
                  <button
                    onClick={() =>
                      setPreviewId(previewId === pb.id ? null : pb.id)
                    }
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {previewId === pb.id ? "Hide Preview" : "Preview"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Section */}
      {previewPlaybook?.content && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-100">
              {previewPlaybook.title}
            </h3>
            <button
              onClick={() => setPreviewId(null)}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-800 rounded-md p-4">
              {previewPlaybook.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
