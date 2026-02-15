"use client";

import React, { useCallback, useEffect, useState } from "react";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config?: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
  lastRunStatus?: string;
  lastRunAt?: string;
  createdAt: string;
}

interface RunHistory {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

const STEP_TYPES = [
  {
    type: "web-search",
    label: "Web Search",
    description: "Search the web for information",
  },
  {
    type: "company-lookup",
    label: "Company Lookup",
    description: "Look up company details",
  },
  {
    type: "filing-search",
    label: "Filing Search",
    description: "Search regulatory filings",
  },
  {
    type: "news-scan",
    label: "News Scan",
    description: "Scan recent news articles",
  },
  {
    type: "contact-enrich",
    label: "Contact Enrichment",
    description: "Enrich contact data",
  },
  {
    type: "ai-analysis",
    label: "AI Analysis",
    description: "Run AI analysis on gathered data",
  },
  {
    type: "report-generate",
    label: "Report Generation",
    description: "Generate a summary report",
  },
  {
    type: "alert-check",
    label: "Alert Check",
    description: "Check and trigger alerts",
  },
];

const RUN_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  running: "bg-blue-500/20 text-blue-400",
  failed: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-zinc-500/20 text-zinc-400",
};

type NewWorkflowForm = {
  name: string;
  description: string;
  steps: { type: string; name: string }[];
};

const emptyForm: NewWorkflowForm = {
  name: "",
  description: "",
  steps: [],
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewWorkflowForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistory[]>([]);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  async function fetchRunHistory(workflowId: string) {
    try {
      const res = await fetch(
        `/api/sales-hunter/intelligence/workflows/${workflowId}/runs`,
      );
      if (res.ok) {
        const data = await res.json();
        setRunHistory(data.runs ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch run history:", error);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-hunter/intelligence/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        fetchWorkflows();
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(workflowId: string, enabled: boolean) {
    try {
      await fetch(`/api/sales-hunter/intelligence/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      fetchWorkflows();
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  }

  async function handleRun(workflowId: string) {
    try {
      await fetch(
        `/api/sales-hunter/intelligence/workflows/${workflowId}/run`,
        {
          method: "POST",
        },
      );
      fetchWorkflows();
    } catch (error) {
      console.error("Failed to run workflow:", error);
    }
  }

  function addStep(type: string, label: string) {
    setForm({
      ...form,
      steps: [...form.steps, { type, name: label }],
    });
  }

  function removeStep(index: number) {
    setForm({
      ...form,
      steps: form.steps.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Research Workflows
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Build and manage automated research workflows
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "Create Workflow"}
        </button>
      </div>

      {/* Create Workflow Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            New Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Prospect Deep Dive"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What does this workflow do?"
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Step Builder */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">
              Add Steps
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STEP_TYPES.map((st) => (
                <button
                  key={st.type}
                  type="button"
                  onClick={() => addStep(st.type, st.label)}
                  className="text-left bg-zinc-800 border border-zinc-700 rounded-md p-3 hover:border-blue-600 transition-colors"
                >
                  <p className="text-xs font-medium text-zinc-100">
                    {st.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {st.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Steps */}
          {form.steps.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-zinc-400 mb-2">
                Workflow Steps ({form.steps.length})
              </label>
              <div className="space-y-2">
                {form.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-500 w-6">
                        {i + 1}.
                      </span>
                      <span className="text-sm text-zinc-100">{step.name}</span>
                      <span className="text-xs text-zinc-500">
                        ({step.type})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || form.steps.length === 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {submitting ? "Creating..." : "Create Workflow"}
            </button>
          </div>
        </form>
      )}

      {/* Workflows List */}
      {loading ? (
        <div className="text-center text-zinc-400 py-8">Loading...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          No workflows yet. Create your first one above.
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {wf.name}
                    </h3>
                    {wf.lastRunStatus && (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RUN_STATUS_COLORS[wf.lastRunStatus] ?? "bg-zinc-500/20 text-zinc-400"}`}
                      >
                        {wf.lastRunStatus}
                      </span>
                    )}
                  </div>
                  {wf.description && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {wf.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-2">
                    {wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""}
                    {wf.lastRunAt &&
                      ` | Last run: ${new Date(wf.lastRunAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(wf.id, !wf.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      wf.enabled ? "bg-blue-600" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        wf.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleRun(wf.id)}
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium transition-colors"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => {
                      if (selectedWorkflow === wf.id) {
                        setSelectedWorkflow(null);
                        setRunHistory([]);
                      } else {
                        setSelectedWorkflow(wf.id);
                        fetchRunHistory(wf.id);
                      }
                    }}
                    className="px-3 py-1 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    {selectedWorkflow === wf.id ? "Hide History" : "History"}
                  </button>
                </div>
              </div>

              {/* Run History */}
              {selectedWorkflow === wf.id && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">
                    Run History
                  </h4>
                  {runHistory.length === 0 ? (
                    <p className="text-xs text-zinc-500">No runs yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {runHistory.map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between bg-zinc-800 rounded-md px-3 py-2"
                        >
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RUN_STATUS_COLORS[run.status] ?? ""}`}
                          >
                            {run.status}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(run.startedAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
