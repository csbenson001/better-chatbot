export type ChunkOptions = {
  maxChunkSize?: number; // default 1000 characters
  overlapSize?: number; // default 200 characters
  separator?: string; // default "\n\n"
};

export function chunkDocument(
  content: string,
  options: ChunkOptions = {},
): string[] {
  const maxSize = options.maxChunkSize ?? 1000;
  const overlap = options.overlapSize ?? 200;
  const separator = options.separator ?? "\n\n";

  // First split by separator
  const sections = content.split(separator);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const section of sections) {
    if (
      currentChunk.length + section.length + separator.length > maxSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + separator + section;
    } else {
      currentChunk = currentChunk
        ? currentChunk + separator + section
        : section;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle case where a single section is larger than maxSize
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxSize * 1.5) {
      // Force split by sentences
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let subChunk = "";
      for (const sentence of sentences) {
        if (
          subChunk.length + sentence.length > maxSize &&
          subChunk.length > 0
        ) {
          finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += sentence;
        }
      }
      if (subChunk.trim()) finalChunks.push(subChunk.trim());
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}
