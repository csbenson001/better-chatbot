import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const alerts = await salesIntelligenceRepository.selectAlertsByTenantId(
      tenantId,
      {
        status,
        category,
        severity,
        limit,
      },
    );

    return NextResponse.json({ data: alerts });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const {
      category,
      severity,
      title,
      description,
      prospectId,
      leadId,
      sourceUrl,
      sourceType,
      actionItems,
      metadata,
    } = body;

    if (!category || !severity || !title || !description) {
      return NextResponse.json(
        {
          error: "category, severity, title, and description are required",
        },
        { status: 400 },
      );
    }

    const alert = await salesIntelligenceRepository.insertAlert({
      tenantId,
      prospectId: prospectId || null,
      leadId: leadId || null,
      category,
      severity,
      title,
      description,
      sourceUrl,
      sourceType,
      actionItems,
      metadata,
    });

    return NextResponse.json({ data: alert }, { status: 201 });
  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 },
    );
  }
}
