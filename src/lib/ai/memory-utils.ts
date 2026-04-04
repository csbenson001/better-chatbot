/**
 * Returns true if the user+assistant exchange is substantive enough
 * to warrant a memory update API call. Skips trivial acknowledgements.
 */
export function isMemoryWorthyExchange(
  userText: string,
  assistantText: string,
): boolean {
  const combined = `${userText} ${assistantText}`.trim();
  const wordCount = combined.split(/\s+/).filter(Boolean).length;
  return wordCount >= 20;
}
