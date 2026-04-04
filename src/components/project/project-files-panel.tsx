"use client";
import { useRef, useState } from "react";
import { FileIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "ui/button";
import { toast } from "sonner";
import type { ProjectFile } from "app-types/project";
import { cn } from "lib/utils";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];
const ACCEPT_ATTR = ".pdf,.docx,.txt,.csv,.md,.json,.png,.jpg,.jpeg,.gif,.webp";

interface ProjectFilesPanelProps {
  projectId: string;
  initialFiles: ProjectFile[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesPanel({
  projectId,
  initialFiles,
}: ProjectFilesPanelProps) {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (files.length >= MAX_FILES)
      return `Maximum ${MAX_FILES} files per project`;
    if (file.size > MAX_FILE_SIZE_BYTES)
      return `"${file.name}" exceeds the 10 MB limit`;
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !ACCEPT_ATTR.split(",").some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      )
    ) {
      return `"${file.name}" is not a supported file type`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Upload failed");
      }
      const newFile: ProjectFile = await res.json();
      setFiles((prev) => [...prev, newFile]);
      toast.success(`Uploaded ${file.name}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : `Failed to upload ${file.name}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Remove "${filename}" from this project?`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File removed");
    } catch {
      toast.error("Failed to remove file");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    for (const file of dropped) await uploadFile(file);
  };

  const atLimit = files.length >= MAX_FILES;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileIcon className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Files</span>
          {files.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {files.length}/{MAX_FILES}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || atLimit}
          title={atLimit ? `Maximum ${MAX_FILES} files reached` : "Upload file"}
        >
          <PlusIcon className="size-3" />
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={ACCEPT_ATTR}
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            selected.forEach(uploadFile);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-1 mb-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40"
            >
              <FileIcon className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs truncate flex-1">{file.filename}</span>
              <span className="text-xs text-muted-foreground/50 shrink-0">
                {formatBytes(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => deleteFile(file.id, file.filename)}
              >
                <Trash2Icon className="size-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center transition-colors cursor-pointer",
            isDragOver && "border-yale-blue bg-yale-blue/10",
            isUploading && "opacity-50 pointer-events-none",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon className="size-5 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {isUploading
              ? "Uploading..."
              : "Add PDFs, documents, or other text to reference in this project."}
          </p>
        </div>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground/60 text-center py-2">
          Maximum {MAX_FILES} files reached. Delete a file to upload more.
        </p>
      )}
    </div>
  );
}
