"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import type { Project, ProjectFile } from "app-types/project";
import type { ChatThread } from "app-types/chat";
import { ProjectChatList } from "./project-chat-list";
import { ProjectSidebar } from "./project-sidebar";
import { NewChatInProjectButton } from "./new-chat-in-project-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { toast } from "sonner";

interface ProjectDetailProps {
  project: Project;
  files: ProjectFile[];
  threads: ChatThread[];
}

export function ProjectDetail({ project, files, threads }: ProjectDetailProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setIsEditing(false);
      toast.success("Project updated");
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(project.name);
    setDescription(project.description ?? "");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Project deleted");
      router.push("/projects");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Center column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="p-6 border-b border-border/60">
          <div className="flex items-start gap-3 mb-4">
            <FolderIcon className="size-6 text-yale-blue mt-1 shrink-0" />

            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold h-auto py-0.5 px-1 border-0 border-b rounded-none focus-visible:ring-0"
                  placeholder="Project name"
                  autoFocus
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-sm resize-none min-h-[60px]"
                  placeholder="Project description (optional)"
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <XIcon className="size-3 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <CheckIcon className="size-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight truncate">
                  {name}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <PencilIcon className="size-3 mr-2" />
                    Rename / Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <NewChatInProjectButton projectId={project.id} projectName={name} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <ProjectChatList threads={threads} projectId={project.id} />
        </div>
      </div>

      {/* Right sidebar */}
      <ProjectSidebar project={project} files={files} />
    </div>
  );
}
