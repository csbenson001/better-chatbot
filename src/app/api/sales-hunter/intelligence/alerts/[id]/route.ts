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

    const alert = await salesIntelligenceRepository.selectAlertById(
      id,
      tenantId,
    );
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ data: alert });
  } catch (error) {
    console.error("Failed to fetch alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert" },
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

    const { status, acknowledgedBy } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    const alert = await salesIntelligenceRepository.updateAlertStatus(
      id,
      tenantId,
      status,
      acknowledgedBy,
    );

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ data: alert });
  } catch (error) {
    console.error("Failed to update alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 },
    );
  }
}
