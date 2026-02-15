import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { generateOutreachSequence } from "lib/platform/sales-intelligence/outreach-generator";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const prospectId = searchParams.get("prospectId") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const sequences =
      await salesIntelligenceRepository.selectOutreachSequencesByTenantId(
        tenantId,
        { status, prospectId, limit },
      );

    return NextResponse.json({ data: sequences });
  } catch (error) {
    console.error("Failed to fetch outreach sequences:", error);
    return NextResponse.json(
      { error: "Failed to fetch outreach sequences" },
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
      contactId,
      name,
      prospectName,
      contactName,
      contactTitle,
      industry,
      regulatoryContext,
      recentSignals,
    } = body;

    if (!name || !prospectName || !contactName || !contactTitle) {
      return NextResponse.json(
        {
          error:
            "name, prospectName, contactName, and contactTitle are required",
        },
        { status: 400 },
      );
    }

    // Generate outreach sequence
    const generated = generateOutreachSequence({
      prospectName,
      contactName,
      contactTitle,
      industry,
      regulatoryContext,
      recentSignals,
    });

    // Store the sequence
    const sequence = await salesIntelligenceRepository.insertOutreachSequence({
      tenantId,
      prospectId: prospectId || null,
      contactId: contactId || null,
      name: name || generated.name,
      description: `Outreach sequence for ${contactName} at ${prospectName}`,
      steps: generated.steps,
      personalizationContext: {
        prospectName,
        contactName,
        contactTitle,
        industry,
        regulatoryContext,
        recentSignals,
      },
    });

    return NextResponse.json({ data: sequence }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate outreach sequence:", error);
    return NextResponse.json(
      { error: "Failed to generate outreach sequence" },
      { status: 500 },
    );
  }
}
