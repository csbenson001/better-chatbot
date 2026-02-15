import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { knowledgeRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const KnowledgeCategoryCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;

    const categories =
      await knowledgeRepository.selectCategoriesByTenantId(tenantId);

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") ?? DEFAULT_TENANT_ID;

    const body = await request.json();
    const parsed = KnowledgeCategoryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const category = await knowledgeRepository.insertCategory({
      tenantId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? undefined,
      metadata: {},
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
