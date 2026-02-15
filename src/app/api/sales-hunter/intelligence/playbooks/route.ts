import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { generatePlaybook } from "lib/platform/sales-intelligence/playbook-builder";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const industryId = searchParams.get("industryId") || undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const playbooks =
      await salesIntelligenceRepository.selectPlaybooksByTenantId(tenantId, {
        type,
        status,
        industryId,
        limit,
      });

    return NextResponse.json({ data: playbooks });
  } catch (error) {
    console.error("Failed to fetch playbooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbooks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const {
      type,
      title,
      content,
      sections,
      industryId,
      targetPersona,
      tags,
      autoGenerate,
      targetCompetitor,
    } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    // Auto-generate using playbook builder
    if (autoGenerate) {
      const generated = await generatePlaybook({
        tenantId,
        industryId,
        type,
        targetCompetitor,
        targetPersona,
      });

      const playbook = await salesIntelligenceRepository.insertPlaybook({
        tenantId,
        industryId: industryId || null,
        type,
        title: generated.title,
        content: generated.content,
        sections: generated.sections,
        targetPersona,
        tags: generated.tags,
      });

      return NextResponse.json({ data: playbook }, { status: 201 });
    }

    if (!title) {
      return NextResponse.json(
        { error: "title is required when not auto-generating" },
        { status: 400 },
      );
    }

    const playbook = await salesIntelligenceRepository.insertPlaybook({
      tenantId,
      industryId: industryId || null,
      type,
      title,
      content,
      sections,
      targetPersona,
      tags,
    });

    return NextResponse.json({ data: playbook }, { status: 201 });
  } catch (error) {
    console.error("Failed to create playbook:", error);
    return NextResponse.json(
      { error: "Failed to create playbook" },
      { status: 500 },
    );
  }
}
