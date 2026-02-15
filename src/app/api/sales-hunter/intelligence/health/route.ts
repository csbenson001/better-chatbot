import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { assessCustomerHealth } from "lib/platform/sales-intelligence/customer-health";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const healthStatus = searchParams.get("healthStatus") || undefined;
    const minScore = searchParams.get("minScore")
      ? Number(searchParams.get("minScore"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const records =
      await salesIntelligenceRepository.selectCustomerHealthByTenantId(
        tenantId,
        { healthStatus, minScore, limit },
      );

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Failed to fetch customer health records:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer health records" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const { leadId, companyId, engagement, contract, usage } = body;

    if (!leadId || !engagement || !contract || !usage) {
      return NextResponse.json(
        {
          error: "leadId, engagement, contract, and usage are required",
        },
        { status: 400 },
      );
    }

    // Assess customer health
    const assessment = assessCustomerHealth({
      leadId,
      tenantId,
      engagement,
      contract,
      usage,
    });

    // Store the health record
    const record = await salesIntelligenceRepository.insertCustomerHealth({
      tenantId,
      leadId,
      companyId: companyId || null,
      healthScore: assessment.healthScore,
      healthStatus: assessment.healthStatus,
      engagementScore: assessment.engagementScore,
      adoptionScore: assessment.adoptionScore,
      sentimentScore: assessment.sentimentScore,
      expansionProbability: assessment.expansionProbability,
      churnRisk: assessment.churnRisk,
      factors: assessment.factors,
      expansionOpportunities: assessment.expansionOpportunities,
    });

    return NextResponse.json(
      { data: { ...record, assessment } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to assess customer health:", error);
    return NextResponse.json(
      { error: "Failed to assess customer health" },
      { status: 500 },
    );
  }
}
