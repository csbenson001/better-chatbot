export type ExportFormat = "markdown" | "json" | "html";

export interface ExportMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface ExportThread {
  id: string;
  title: string;
  messages: ExportMessage[];
  createdAt?: Date;
  exportedAt?: Date;
}

// Convert title to a safe filename slug
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export function buildMarkdownExport(thread: ExportThread): string {
  const exportedAt = (thread.exportedAt ?? new Date()).toISOString();
  const header = `# ${thread.title}\n\n*Exported ${exportedAt}*\n\n---\n\n`;
  const body = thread.messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const label = m.role === "user" ? "## You" : "## Assistant";
      return `${label}\n\n${m.content}\n\n---`;
    })
    .join("\n\n");
  return header + body;
}

export function buildJsonExport(thread: ExportThread): object {
  return {
    id: thread.id,
    title: thread.title,
    exportedAt: (thread.exportedAt ?? new Date()).toISOString(),
    messageCount: thread.messages.filter((m) => m.role !== "system").length,
    messages: thread.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt?.toISOString(),
      })),
  };
}

export function buildHtmlExport(thread: ExportThread): string {
  const exportedAt = (thread.exportedAt ?? new Date()).toISOString();
  const messages = thread.messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const label = m.role === "user" ? "You" : "Assistant";
      const cls = m.role === "user" ? "user" : "assistant";
      const escapedContent = m.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<div class="message ${cls}"><strong>${label}:</strong><p>${escapedContent}</p></div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thread.title}</title>
<style>
  body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  .message { margin: 1.5rem 0; padding: 1rem; border-radius: 8px; }
  .user { background: #f0f4ff; }
  .assistant { background: #f8f8f8; }
  h1 { border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
  .meta { color: #888; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>${thread.title}</h1>
<p class="meta">Exported ${exportedAt}</p>
${messages}
</body>
</html>`;
}

export function getExportFilename(
  thread: ExportThread,
  format: ExportFormat,
): string {
  const slug = titleToSlug(thread.title) || "conversation";
  const ext = format === "markdown" ? "md" : format;
  return `${slug}.${ext}`;
}

export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case "markdown":
      return "text/markdown";
    case "json":
      return "application/json";
    case "html":
      return "text/html";
  }
}
