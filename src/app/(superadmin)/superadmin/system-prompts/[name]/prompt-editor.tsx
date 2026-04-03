"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SystemPromptMeta } from "lib/db/pg/repositories/system-prompt-repository.pg";

type VersionWithContent = SystemPromptMeta & { content: string };

export function PromptEditor({
  promptName,
  versions,
  activeId,
  initialContent = "",
}: {
  promptName: string;
  versions: VersionWithContent[];
  activeId: string | null;
  initialContent?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(promptName);
  const [description, setDescription] = useState(
    versions[0]?.description ?? "",
  );
  const [content, setContent] = useState(initialContent);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    activeId ?? versions[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isNew = promptName === "";

  async function handleSave() {
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/system-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Save failed");
      }
      setSuccessMsg("New version saved.");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    if (!selectedVersionId) return;
    setError(null);
    setSuccessMsg(null);
    setActivating(true);
    try {
      const res = await fetch(
        `/api/superadmin/system-prompts/${encodeURIComponent(name)}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedVersionId }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Activation failed");
      }
      setSuccessMsg(
        "Version activated. Changes take effect within 30 seconds.",
      );
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setActivating(false);
    }
  }

  function handleVersionSelect(v: VersionWithContent) {
    setSelectedVersionId(v.id);
    if (v.content) setContent(v.content);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isNew ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prompt name (e.g. default)"
                className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-zinc-100 text-sm w-48 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <h2 className="text-xl font-semibold text-zinc-100">{name}</h2>
            )}
            <span className="text-xs text-zinc-500">
              {isNew ? "new prompt" : `v${versions[0]?.version ?? "—"} latest`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !content.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-md transition-colors"
            >
              {saving ? "Saving…" : "Save as New Version"}
            </button>
            {!isNew && selectedVersionId && selectedVersionId !== activeId && (
              <button
                onClick={handleActivate}
                disabled={activating}
                className="px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm rounded-md transition-colors"
              >
                {activating ? "Activating…" : "Activate This Version"}
              </button>
            )}
          </div>
        </div>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-zinc-400 text-sm focus:outline-none focus:border-blue-500"
        />

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="text-green-400 text-sm bg-green-950/30 border border-green-800 rounded px-3 py-2">
            {successMsg}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md p-4 text-zinc-100 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
          placeholder="System prompt content…"
          spellCheck={false}
        />
      </div>

      {!isNew && versions.length > 0 && (
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Version History
          </p>
          <div className="flex-1 overflow-y-auto space-y-1">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVersionSelect(v)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                  selectedVersionId === v.id
                    ? "bg-blue-600/20 text-blue-300 border border-blue-700/50"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">v{v.version}</span>
                  {v.id === activeId && (
                    <span className="text-xs text-green-400">active</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(v.updatedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-zinc-600 truncate">
                  by {v.createdBy.slice(0, 8)}…
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
