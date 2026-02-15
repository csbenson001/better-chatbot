import { NextResponse } from "next/server";
import { enrichContact } from "lib/platform/contacts/enrichment-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json().catch(() => ({}));
    const result = await enrichContact(id, tenantId, body.sourceTypes);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to enrich contact",
      },
      { status: 500 },
    );
  }
}
