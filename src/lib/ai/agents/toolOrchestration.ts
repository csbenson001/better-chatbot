export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export type ToolBatch =
  | { type: "concurrent"; calls: ToolCall[] }
  | { type: "serial"; call: ToolCall };

// Tools declare whether they are safe to run concurrently
// Read-only tools (web search, file read) → true
// Write tools (execute_python, write_file) → false
const CONCURRENT_SAFE_TOOLS = new Set([
  "search_web",
  "fetch_url",
  "read_file",
  "list_files",
  "get_weather",
]);

export function isConcurrencySafe(toolName: string): boolean {
  return CONCURRENT_SAFE_TOOLS.has(toolName);
}

// Group consecutive concurrent-safe tool calls into batches
// Serial tools always get their own batch
// Example: [read(✓), search(✓), execute(✗), read(✓)] →
//   [concurrent: [read, search]], [serial: execute], [concurrent: [read]]
export function buildToolBatches(calls: ToolCall[]): ToolBatch[] {
  const batches: ToolBatch[] = [];
  let concurrentBatch: ToolCall[] = [];

  const flushConcurrent = () => {
    if (concurrentBatch.length > 0) {
      batches.push({ type: "concurrent", calls: [...concurrentBatch] });
      concurrentBatch = [];
    }
  };

  for (const call of calls) {
    if (isConcurrencySafe(call.name)) {
      concurrentBatch.push(call);
    } else {
      flushConcurrent();
      batches.push({ type: "serial", call });
    }
  }

  flushConcurrent();
  return batches;
}

// Estimate concurrency level: total concurrent calls across all batches
export function estimateConcurrencyLevel(batches: ToolBatch[]): number {
  return batches
    .filter(
      (b): b is Extract<ToolBatch, { type: "concurrent" }> =>
        b.type === "concurrent",
    )
    .reduce((max, b) => Math.max(max, b.calls.length), 0);
}
