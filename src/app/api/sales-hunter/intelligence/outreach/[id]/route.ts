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

    const sequence =
      await salesIntelligenceRepository.selectOutreachSequenceById(
        id,
        tenantId,
      );
    if (!sequence) {
      return NextResponse.json(
        { error: "Outreach sequence not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: sequence });
  } catch (error) {
    console.error("Failed to fetch outreach sequence:", error);
    return NextResponse.json(
      { error: "Failed to fetch outreach sequence" },
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

    const sequence = await salesIntelligenceRepository.updateOutreachSequence(
      id,
      tenantId,
      body,
    );

    if (!sequence) {
      return NextResponse.json(
        { error: "Outreach sequence not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: sequence });
  } catch (error) {
    console.error("Failed to update outreach sequence:", error);
    return NextResponse.json(
      { error: "Failed to update outreach sequence" },
      { status: 500 },
    );
  }
}
