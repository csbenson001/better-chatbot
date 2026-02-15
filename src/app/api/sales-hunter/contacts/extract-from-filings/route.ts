import { NextResponse } from "next/server";
import { extractContactsFromFilings } from "lib/platform/contacts/filing-contact-extractor";

export async function POST(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json().catch(() => ({}));
    const result = await extractContactsFromFilings(tenantId, {
      sourceId: body.sourceId,
      limit: body.limit,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to extract contacts",
      },
      { status: 500 },
    );
  }
}
