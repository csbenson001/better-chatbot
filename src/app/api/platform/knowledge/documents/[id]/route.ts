import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;
    const { id } = await params;

    const document = await knowledgeRepository.selectDocumentById(id, tenantId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Also fetch associated chunks
    const chunks = await knowledgeRepository.selectChunksByDocumentId(id);

    return NextResponse.json({ data: { ...document, chunks } });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;
    const { id } = await params;

    // Delete chunks first
    await knowledgeRepository.deleteChunksByDocumentId(id);

    // Then delete the document
    await knowledgeRepository.deleteDocument(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
