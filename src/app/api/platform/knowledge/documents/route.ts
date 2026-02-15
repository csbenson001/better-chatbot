import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { knowledgeRepository } from "lib/db/repository";
import { ingestDocument } from "lib/platform/knowledge/ingestion";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const KnowledgeDocumentCreateSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  documentType: z.enum([
    "pdf",
    "web-page",
    "text",
    "markdown",
    "csv",
    "json",
    "api-response",
    "filing",
    "report",
    "email",
    "presentation",
    "spreadsheet",
  ]),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const documentType = searchParams.get("documentType") as
      | "pdf"
      | "text"
      | "markdown"
      | "web-page"
      | "csv"
      | "json"
      | "api-response"
      | "filing"
      | "report"
      | "email"
      | "presentation"
      | "spreadsheet"
      | undefined;
    const status = searchParams.get("status") as
      | "pending"
      | "processing"
      | "indexed"
      | "failed"
      | undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const documents = await knowledgeRepository.selectDocumentsByTenantId(
      tenantId,
      { categoryId, documentType, status, limit, offset },
    );

    const total = await knowledgeRepository.countDocumentsByTenantId(tenantId);

    return NextResponse.json({ data: documents, total });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;

    const body = await request.json();
    const parsed = KnowledgeDocumentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const doc = await knowledgeRepository.insertDocument({
      tenantId,
      title: parsed.data.title,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId ?? undefined,
      documentType: parsed.data.documentType,
      source: "upload",
      tags: parsed.data.tags ?? [],
      sourceUrl: parsed.data.sourceUrl ?? undefined,
      metadata: parsed.data.metadata ?? {},
    });

    // Fire-and-forget ingestion
    ingestDocument(doc.id, tenantId).catch(console.error);

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}
