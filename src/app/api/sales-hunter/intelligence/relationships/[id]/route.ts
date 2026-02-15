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

    const map = await salesIntelligenceRepository.selectRelationshipMapById(
      id,
      tenantId,
    );
    if (!map) {
      return NextResponse.json(
        { error: "Relationship map not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: map });
  } catch (error) {
    console.error("Failed to fetch relationship map:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationship map" },
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

    const map = await salesIntelligenceRepository.updateRelationshipMap(
      id,
      tenantId,
      body,
    );

    if (!map) {
      return NextResponse.json(
        { error: "Relationship map not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: map });
  } catch (error) {
    console.error("Failed to update relationship map:", error);
    return NextResponse.json(
      { error: "Failed to update relationship map" },
      { status: 500 },
    );
  }
}
