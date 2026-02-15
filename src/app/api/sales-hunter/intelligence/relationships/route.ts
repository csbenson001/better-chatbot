import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { analyzeRelationships } from "lib/platform/sales-intelligence/relationship-mapper";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const prospectId = searchParams.get("prospectId") || undefined;
    const leadId = searchParams.get("leadId") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const maps =
      await salesIntelligenceRepository.selectRelationshipMapsByTenantId(
        tenantId,
        { prospectId, leadId, limit },
      );

    return NextResponse.json({ data: maps });
  } catch (error) {
    console.error("Failed to fetch relationship maps:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationship maps" },
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
      leadId,
      companyName,
      contacts,
      relationships,
      dealStrategy,
      autoAnalyze,
    } = body;

    // Auto-analyze using relationship mapper
    if (autoAnalyze && prospectId) {
      const analysis = await analyzeRelationships(tenantId, prospectId);

      const map = await salesIntelligenceRepository.insertRelationshipMap({
        tenantId,
        prospectId,
        leadId: leadId || null,
        companyName: analysis.companyName,
        contacts: analysis.contacts,
        relationships: analysis.relationships,
        dealStrategy: [
          ...analysis.coverageGaps.map((g) => `Gap: ${g}`),
          ...analysis.recommendations,
        ].join("\n"),
      });

      return NextResponse.json({ data: { ...map, analysis } }, { status: 201 });
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "companyName is required" },
        { status: 400 },
      );
    }

    const map = await salesIntelligenceRepository.insertRelationshipMap({
      tenantId,
      prospectId: prospectId || null,
      leadId: leadId || null,
      companyName,
      contacts,
      relationships,
      dealStrategy,
    });

    return NextResponse.json({ data: map }, { status: 201 });
  } catch (error) {
    console.error("Failed to create relationship map:", error);
    return NextResponse.json(
      { error: "Failed to create relationship map" },
      { status: 500 },
    );
  }
}
