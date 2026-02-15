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

    const brief = await salesIntelligenceRepository.selectBriefById(
      id,
      tenantId,
    );
    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ data: brief });
  } catch (error) {
    console.error("Failed to fetch brief:", error);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;
    const body = await request.json();

    const brief = await salesIntelligenceRepository.updateBrief(
      id,
      tenantId,
      body,
    );

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ data: brief });
  } catch (error) {
    console.error("Failed to update brief:", error);
    return NextResponse.json(
      { error: "Failed to update brief" },
      { status: 500 },
    );
  }
}
