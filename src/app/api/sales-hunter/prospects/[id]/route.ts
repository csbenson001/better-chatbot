import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    const prospect = await prospectingRepository.selectProspectById(
      id,
      tenantId,
    );
    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: prospect });
  } catch (error) {
    console.error("Failed to fetch prospect:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospect" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const prospect = await prospectingRepository.updateProspect(
      id,
      tenantId,
      body,
    );

    return NextResponse.json({ data: prospect });
  } catch (error) {
    console.error("Failed to update prospect:", error);
    return NextResponse.json(
      { error: "Failed to update prospect" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    await prospectingRepository.deleteProspect(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete prospect:", error);
    return NextResponse.json(
      { error: "Failed to delete prospect" },
      { status: 500 },
    );
  }
}
