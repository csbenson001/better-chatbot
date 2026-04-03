export interface E2BExecutionImage {
  base64: string;
  format: string;
}

export interface E2BExecutionResult {
  stdout: string;
  stderr: string;
  images: E2BExecutionImage[];
  sessionId: string;
}

export type ArtifactContentType =
  | "python"
  | "html"
  | "react"
  | "svg"
  | "mermaid"
  | "markdown";

export function detectArtifactContentType(code: string): ArtifactContentType {
  const trimmed = code.trim();
  // Explicit ARTIFACT_TYPE marker wins (AI can override detection)
  const markerMatch = trimmed.match(/^ARTIFACT_TYPE:(\w+)/);
  if (markerMatch) {
    const t = markerMatch[1] as ArtifactContentType;
    if (["html", "react", "svg", "mermaid", "markdown"].includes(t)) return t;
  }
  if (trimmed.startsWith("<svg") || trimmed.startsWith("<SVG")) return "svg";
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html"))
    return "html";
  // Chart.js / Plotly output often starts with <div or <script without DOCTYPE
  if (
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<canvas") ||
    trimmed.startsWith("<script")
  )
    return "html";
  if (
    /^(graph |sequenceDiagram|gantt|erDiagram|flowchart |pie |mindmap|timeline|classDiagram)/m.test(
      trimmed,
    )
  )
    return "mermaid";
  if (
    /import React|from ['"]react['"]|export default function [A-Z]/.test(
      trimmed,
    )
  )
    return "react";
  if (
    trimmed.length > 300 &&
    /^#{1,6} |\*\*[^*]+\*\*|^- [A-Z]|\|.+\|/m.test(trimmed) &&
    !/import |def |class |print\(/.test(trimmed)
  )
    return "markdown";
  return "python";
}

export interface ArtifactData {
  id: string;
  code: string;
  contentType: ArtifactContentType;
  stdout: string;
  stderr?: string;
  images: E2BExecutionImage[];
  title: string;
  sessionId: string;
  downloadUrl?: string;
  downloadFilename?: string;
}
