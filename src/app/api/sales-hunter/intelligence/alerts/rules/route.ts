import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    const rules =
      await salesIntelligenceRepository.selectAlertRulesByTenantId(tenantId);

    return NextResponse.json({ data: rules });
  } catch (error) {
    console.error("Failed to fetch alert rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert rules" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const {
      name,
      description,
      category,
      conditions,
      severity,
      notifyChannels,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 },
      );
    }

    const rule = await salesIntelligenceRepository.insertAlertRule({
      tenantId,
      name,
      description,
      category,
      conditions,
      severity,
      notifyChannels,
    });

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create alert rule:", error);
    return NextResponse.json(
      { error: "Failed to create alert rule" },
      { status: 500 },
    );
  }
}
