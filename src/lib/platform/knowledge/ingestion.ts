import { knowledgeRepository } from "lib/db/repository";
import { chunkDocument } from "./chunker";
import { generateEmbeddings } from "./embeddings";

export async function ingestDocument(
  documentId: string,
  tenantId: string,
): Promise<{
  chunksCreated: number;
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Load the document
    const doc = await knowledgeRepository.selectDocumentById(
      documentId,
      tenantId,
    );
    if (!doc) throw new Error("Document not found");

    // 2. Update status to processing
    await knowledgeRepository.updateDocumentStatus(doc.id, "processing");

    // 3. Chunk the content
    const chunks = chunkDocument(doc.content);

    // 4. Generate embeddings for all chunks
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddings(chunks);
    } catch {
      // If embedding fails, store chunks without embeddings
      // They can be embedded later
      embeddings = chunks.map(() => []);
    }

    // 5. Delete existing chunks (for re-indexing)
    await knowledgeRepository.deleteChunksByDocumentId(doc.id);

    // 6. Store chunks with embeddings
    const chunkRecords = chunks.map((content, index) => ({
      documentId: doc.id,
      tenantId,
      chunkIndex: index,
      content,
      embedding: embeddings[index]?.length > 0 ? embeddings[index] : null,
      metadata: {
        charCount: content.length,
        wordCount: content.split(/\s+/).length,
      },
    }));

    await knowledgeRepository.insertChunks(chunkRecords);

    // 7. Update document status
    await knowledgeRepository.updateDocumentStatus(
      doc.id,
      "indexed",
      new Date(),
    );

    return { chunksCreated: chunks.length, success: true };
  } catch (error) {
    await knowledgeRepository.updateDocumentStatus(documentId, "failed");
    return {
      chunksCreated: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function searchKnowledge(
  tenantId: string,
  query: string,
  options?: { categoryIds?: string[]; limit?: number; minScore?: number },
) {
  // Import here to avoid circular deps
  const { generateEmbedding } = await import("./embeddings");
  const queryEmbedding = await generateEmbedding(query);
  return knowledgeRepository.searchByEmbedding(
    tenantId,
    queryEmbedding,
    options,
  );
}
