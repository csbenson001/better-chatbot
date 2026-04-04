"use client";
import { useState } from "react";
import {
  ClockIcon,
  LockIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { toast } from "sonner";

interface ProjectMemoryPanelProps {
  projectId: string;
  memory: string | null;
}

export function ProjectMemoryPanel({
  projectId,
  memory: initialMemory,
}: ProjectMemoryPanelProps) {
  const [memory, setMemory] = useState(initialMemory ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const patchMemory = async (value: string, successMsg: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/memory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory: value }),
      });
      if (!res.ok) throw new Error();
      setMemory(value);
      setIsEditing(false);
      setDraft("");
      toast.success(successMsg);
    } catch {
      toast.error("Failed to update memory");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = () => {
    setDraft(memory);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft("");
  };

  const handleClear = async () => {
    if (!confirm("Clear all project memory? This cannot be undone.")) return;
    await patchMemory("", "Memory cleared");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 border border-border/40 rounded px-1.5 py-0.5">
            <LockIcon className="size-2.5" />
            Only you
          </div>
          {!isEditing && memory && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleClear}
              disabled={isSaving}
              title="Clear memory"
            >
              <Trash2Icon className="size-3 text-muted-foreground" />
            </Button>
          )}
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={startEdit}
            >
              <PencilIcon className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-xs min-h-[120px] resize-none"
            placeholder="Project memory..."
          />
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={isSaving}
            >
              <XIcon className="size-3 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => patchMemory(draft, "Memory updated")}
              disabled={isSaving}
            >
              <CheckIcon className="size-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {memory || "Project memory will show here after a few chats."}
        </p>
      )}
    </div>
  );
}
