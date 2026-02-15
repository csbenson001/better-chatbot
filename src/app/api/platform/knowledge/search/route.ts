import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchKnowledge } from "lib/platform/knowledge/ingestion";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  categoryIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;

    const body = await request.json();
    const parsed = SearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const results = await searchKnowledge(tenantId, parsed.data.query, {
      categoryIds: parsed.data.categoryIds,
      limit: parsed.data.limit,
      minScore: parsed.data.minScore,
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 },
    );
  }
}
