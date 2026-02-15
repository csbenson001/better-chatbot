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

    const playbook = await salesIntelligenceRepository.selectPlaybookById(
      id,
      tenantId,
    );
    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: playbook });
  } catch (error) {
    console.error("Failed to fetch playbook:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbook" },
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

    const playbook = await salesIntelligenceRepository.updatePlaybook(
      id,
      tenantId,
      body,
    );

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: playbook });
  } catch (error) {
    console.error("Failed to update playbook:", error);
    return NextResponse.json(
      { error: "Failed to update playbook" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;

    await salesIntelligenceRepository.deletePlaybook(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete playbook:", error);
    return NextResponse.json(
      { error: "Failed to delete playbook" },
      { status: 500 },
    );
  }
}
