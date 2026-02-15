import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";
import { FilingRecordCreateSchema } from "app-types/prospecting";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const sourceId = searchParams.get("sourceId") || undefined;
    const prospectId = searchParams.get("prospectId") || undefined;
    const filingType = searchParams.get("filingType") || undefined;
    const state = searchParams.get("state") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : 50;
    const offset = searchParams.get("offset")
      ? Math.max(0, Number(searchParams.get("offset")))
      : 0;

    const filings = await prospectingRepository.selectFilingRecordsByTenantId(
      tenantId,
      {
        sourceId,
        prospectId,
        filingType,
        state,
        limit,
        offset,
      },
    );

    return NextResponse.json({ data: filings });
  } catch (error) {
    console.error("Failed to fetch filing records:", error);
    return NextResponse.json(
      { error: "Failed to fetch filing records" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const data = FilingRecordCreateSchema.parse({ ...body, tenantId });
    const filing = await prospectingRepository.insertFilingRecord(data);

    return NextResponse.json({ data: filing }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filing record data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create filing record:", error);
    return NextResponse.json(
      { error: "Failed to create filing record" },
      { status: 500 },
    );
  }
}
