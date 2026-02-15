import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { generateSalesBrief } from "lib/platform/sales-intelligence/brief-generator";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const briefType = searchParams.get("briefType") || undefined;
    const prospectId = searchParams.get("prospectId") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const briefs = await salesIntelligenceRepository.selectBriefsByTenantId(
      tenantId,
      { status, briefType, prospectId, limit },
    );

    return NextResponse.json({ data: briefs });
  } catch (error) {
    console.error("Failed to fetch briefs:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const { prospectId, companyId, briefType, title } = body;

    if (!briefType || !title) {
      return NextResponse.json(
        { error: "briefType and title are required" },
        { status: 400 },
      );
    }

    const brief = await salesIntelligenceRepository.insertBrief({
      tenantId,
      prospectId: prospectId || null,
      companyId: companyId || null,
      briefType,
      title,
    });

    // If prospectId or companyId provided, generate the brief content
    if (prospectId || companyId) {
      try {
        const generated = await generateSalesBrief({
          tenantId,
          prospectId,
          companyId,
          briefType,
        });

        const updated = await salesIntelligenceRepository.updateBrief(
          brief.id,
          tenantId,
          {
            title: generated.title,
            content: generated.content,
            sections: generated.sections,
            status: "completed",
            generatedBy: "ai",
          },
        );

        return NextResponse.json({ data: updated }, { status: 201 });
      } catch (genError) {
        console.error("Brief generation failed:", genError);
        await salesIntelligenceRepository.updateBrief(brief.id, tenantId, {
          status: "failed",
        });
      }
    }

    return NextResponse.json({ data: brief }, { status: 201 });
  } catch (error) {
    console.error("Failed to create brief:", error);
    return NextResponse.json(
      { error: "Failed to create brief" },
      { status: 500 },
    );
  }
}
