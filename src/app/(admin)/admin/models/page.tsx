"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  TenantProviderKeyMasked,
  SupportedProvider,
} from "app-types/model-config";

type ModelRow = {
  provider: string;
  modelName: string;
  enabled: boolean;
  isDefault: boolean;
  isToolCallUnsupported: boolean;
};

type ProviderForm = {
  apiKey: string;
  enabled: boolean;
  azureEndpoint: string;
  azureDeploymentName: string;
  azureApiVersion: string;
};

const PROVIDERS: { id: SupportedProvider; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "azure", label: "Azure OpenAI" },
];

const DEFAULT_FORM: ProviderForm = {
  apiKey: "",
  enabled: true,
  azureEndpoint: "",
  azureDeploymentName: "",
  azureApiVersion: "2024-02-01",
};

export default function ModelSettingsPage() {
  const [selected, setSelected] = useState<SupportedProvider>("anthropic");
  const [providerKeys, setProviderKeys] = useState<TenantProviderKeyMasked[]>([]);
  const [modelRows, setModelRows] = useState<ModelRow[]>([]);
  const [form, setForm] = useState<ProviderForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  const fetchAll = useCallback(async () => {
    const [pkRes, msRes] = await Promise.all([
      fetch("/api/admin/models/providers"),
      fetch("/api/admin/models/settings"),
    ]);
    if (pkRes.ok) {
      const data = await pkRes.json();
      setProviderKeys(data.providers ?? []);
    }
    if (msRes.ok) {
      const data = await msRes.json();
      setModelRows(data.settings ?? []);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset form when provider selection changes
  useEffect(() => {
    const pk = providerKeys.find((p) => p.provider === selected);
    setForm({
      ...DEFAULT_FORM,
      enabled: pk?.enabled ?? true,
      azureEndpoint: pk?.azureEndpoint ?? "",
      azureDeploymentName: pk?.azureDeploymentName ?? "",
      azureApiVersion: pk?.azureApiVersion ?? "2024-02-01",
    });
    setRevealKey(false);
    setSaveError(null);
  }, [selected, providerKeys]);

  const providerStatus = (id: string) => {
    const pk = providerKeys.find((p) => p.provider === id);
    if (!pk) return "unconfigured";
    return pk.enabled ? "active" : "disabled";
  };

  const handleSave = async () => {
    const existing = providerKeys.find((p) => p.provider === selected);
    if (!form.apiKey && !existing) {
      setSaveError("API key is required");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        provider: selected,
        apiKey: form.apiKey || existing?.apiKeyMasked || "",
        enabled: form.enabled,
      };
      if (selected === "azure") {
        body.azureEndpoint = form.azureEndpoint || null;
        body.azureDeploymentName = form.azureDeploymentName || null;
        body.azureApiVersion = form.azureApiVersion || "2024-02-01";
      }
      const res = await fetch("/api/admin/models/providers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setSaveError("Save failed. Check your API key and try again.");
        return;
      }
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (
      !confirm(
        `Remove the ${PROVIDERS.find((p) => p.id === selected)?.label} configuration?`,
      )
    )
      return;
    await fetch(`/api/admin/models/providers?provider=${selected}`, {
      method: "DELETE",
    });
    await fetchAll();
  };

  const handleToggle = async (provider: string, modelName: string, enabled: boolean) => {
    setModelRows((prev) =>
      prev.map((r) =>
        r.provider === provider && r.modelName === modelName
          ? { ...r, enabled }
          : r,
      ),
    );
    await fetch("/api/admin/models/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updates: [{ provider, modelName, enabled }] }),
    });
  };

  const handleSetDefault = async (provider: string, modelName: string) => {
    setModelRows((prev) =>
      prev.map((r) => ({
        ...r,
        isDefault: r.provider === provider && r.modelName === modelName,
      })),
    );
    await fetch("/api/admin/models/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        updates: [{ provider, modelName, isDefault: true }],
      }),
    });
  };

  const currentModels = modelRows.filter((r) => r.provider === selected);
  const pk = providerKeys.find((p) => p.provider === selected);

  const StatusDot = ({ status }: { status: string }) => (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
        status === "active"
          ? "bg-green-500"
          : status === "disabled"
            ? "bg-zinc-500"
            : "bg-red-500"
      }`}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Model Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure AI provider API keys and control which models are available
          for this tenant.
        </p>
      </div>

      <div className="flex gap-6 min-h-[580px]">
        {/* Provider sidebar */}
        <aside className="w-48 flex-shrink-0 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3 px-1">
            Providers
          </p>
          {PROVIDERS.map(({ id, label }) => {
            const status = providerStatus(id);
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                  selected === id
                    ? "bg-blue-600/15 border-l-2 border-blue-500 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center">
                  <StatusDot status={status} />
                  {label}
                </div>
                <div
                  className={`text-xs mt-0.5 ml-3.5 ${
                    status === "active"
                      ? "text-green-500"
                      : status === "disabled"
                        ? "text-zinc-500"
                        : "text-red-500"
                  }`}
                >
                  {status === "active"
                    ? "Configured"
                    : status === "disabled"
                      ? "Disabled"
                      : "No API key"}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Detail panel */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Provider config card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-base font-medium text-zinc-100 mb-4">
              {PROVIDERS.find((p) => p.id === selected)?.label} Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type={revealKey ? "text" : "password"}
                    placeholder={pk ? pk.apiKeyMasked : "Enter API key…"}
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setRevealKey((r) => !r)}
                    className="px-3 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-md hover:text-zinc-100 hover:border-zinc-600 transition-colors"
                  >
                    {revealKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {selected === "azure" && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Azure Endpoint URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-resource.openai.azure.com"
                      value={form.azureEndpoint}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, azureEndpoint: e.target.value }))
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Deployment Name
                    </label>
                    <input
                      type="text"
                      placeholder="my-gpt4-deployment"
                      value={form.azureDeploymentName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          azureDeploymentName: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      API Version
                    </label>
                    <input
                      type="text"
                      placeholder="2024-02-01"
                      value={form.azureApiVersion}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          azureApiVersion: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, enabled: e.target.checked }))
                    }
                    className="rounded border-zinc-600 bg-zinc-800 text-blue-600"
                  />
                  Provider enabled
                </label>
              </div>

              {saveError && (
                <p className="text-sm text-red-400">{saveError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-md font-medium transition-colors"
                >
                  {saving ? "Saving…" : "Save Configuration"}
                </button>
                {pk && (
                  <button
                    onClick={handleRemove}
                    className="px-4 py-2 bg-transparent border border-zinc-700 hover:border-red-600 hover:text-red-400 text-zinc-400 text-sm rounded-md transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Models table card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-zinc-100">Models</h2>
                {!pk && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Save an API key above to enable model toggles.
                  </p>
                )}
              </div>
            </div>
            {currentModels.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No models found for this provider.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-zinc-400 w-full">
                      Model
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-zinc-400 whitespace-nowrap">
                      Enabled
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-zinc-400 whitespace-nowrap">
                      Default
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentModels.map((m) => (
                    <tr
                      key={m.modelName}
                      className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={pk ? "text-zinc-200" : "text-zinc-500"}
                        >
                          {m.modelName}
                        </span>
                        {m.isToolCallUnsupported && (
                          <span className="ml-2 text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                            No tools
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={m.enabled}
                          disabled={!pk}
                          onChange={(e) =>
                            handleToggle(
                              m.provider,
                              m.modelName,
                              e.target.checked,
                            )
                          }
                          className="rounded border-zinc-600 bg-zinc-800 text-blue-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="radio"
                          name="default-model"
                          checked={m.isDefault}
                          disabled={!pk || !m.enabled}
                          onChange={() =>
                            handleSetDefault(m.provider, m.modelName)
                          }
                          className="text-blue-600 border-zinc-600 bg-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
