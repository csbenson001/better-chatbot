import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { calculateComplianceBurden } from "lib/platform/sales-intelligence/compliance-calculator";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const prospectId = searchParams.get("prospectId");

    if (!prospectId) {
      return NextResponse.json(
        { error: "prospectId query parameter is required" },
        { status: 400 },
      );
    }

    const records =
      await salesIntelligenceRepository.selectComplianceBurdenByProspectId(
        prospectId,
        tenantId,
      );

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Failed to fetch compliance burden:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance burden" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const {
      prospectId,
      facilityCount,
      regulatoryPrograms,
      state,
      industry,
      employeeCount,
      hasViolations,
    } = body;

    if (!prospectId || !facilityCount || !regulatoryPrograms) {
      return NextResponse.json(
        {
          error:
            "prospectId, facilityCount, and regulatoryPrograms are required",
        },
        { status: 400 },
      );
    }

    // Calculate compliance burden
    const estimate = calculateComplianceBurden({
      facilityCount,
      regulatoryPrograms,
      state,
      industry,
      employeeCount,
      hasViolations,
    });

    // Store the result
    const record = await salesIntelligenceRepository.insertComplianceBurden({
      tenantId,
      prospectId,
      facilityCount,
      regulatoryPrograms,
      estimatedAnnualCost: estimate.estimatedAnnualCost,
      costBreakdown: estimate.costBreakdown,
      riskLevel: estimate.riskLevel,
      savingsOpportunity: estimate.savingsOpportunity,
      roiProjection: estimate.roiProjection,
    });

    return NextResponse.json(
      { data: { ...record, estimate } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to calculate compliance burden:", error);
    return NextResponse.json(
      { error: "Failed to calculate compliance burden" },
      { status: 500 },
    );
  }
}
