import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { analyzeDeal } from "lib/platform/sales-intelligence/win-loss-analyzer";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const outcome = searchParams.get("outcome") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const analyses =
      await salesIntelligenceRepository.selectDealAnalysesByTenantId(tenantId, {
        outcome,
        limit,
      });

    return NextResponse.json({ data: analyses });
  } catch (error) {
    console.error("Failed to fetch deal analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal analyses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const {
      leadId,
      prospectId,
      outcome,
      dealValue,
      salesCycleLength,
      competitorInvolved,
      winLossReasons,
      stages,
    } = body;

    if (!leadId || !outcome || dealValue == null || !salesCycleLength) {
      return NextResponse.json(
        {
          error:
            "leadId, outcome, dealValue, and salesCycleLength are required",
        },
        { status: 400 },
      );
    }

    // Analyze the deal
    const analysis = await analyzeDeal({
      outcome,
      dealValue,
      salesCycleLength,
      competitorInvolved,
      winLossReasons,
      stages,
    });

    // Store the deal analysis
    const record = await salesIntelligenceRepository.insertDealAnalysis({
      tenantId,
      leadId,
      prospectId: prospectId || null,
      outcome,
      dealValue,
      salesCycleLength,
      competitorInvolved,
      winLossReasons,
      stageProgression: stages,
      keyFactors: analysis.keyFactors,
      lessonsLearned: analysis.lessonsLearned,
      recommendations: analysis.recommendations,
    });

    return NextResponse.json(
      { data: { ...record, analysis } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to analyze deal:", error);
    return NextResponse.json(
      { error: "Failed to analyze deal" },
      { status: 500 },
    );
  }
}
