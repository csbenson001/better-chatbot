import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;

    const analysis = await salesIntelligenceRepository.selectDealAnalysisById(
      id,
      tenantId,
    );
    if (!analysis) {
      return NextResponse.json(
        { error: "Deal analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: analysis });
  } catch (error) {
    console.error("Failed to fetch deal analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal analysis" },
      { status: 500 },
    );
  }
}
