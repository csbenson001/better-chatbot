import { NextResponse } from "next/server";
import { contactIntelligenceRepository } from "lib/db/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const contact = await contactIntelligenceRepository.selectContactById(
      id,
      tenantId,
    );
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    const [enrichments, activities] = await Promise.all([
      contactIntelligenceRepository.selectEnrichmentsByContactId(id, tenantId),
      contactIntelligenceRepository.selectActivitiesByContactId(id, tenantId, {
        limit: 20,
      }),
    ]);
    return NextResponse.json({
      data: { ...contact, enrichments, recentActivities: activities },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const contact = await contactIntelligenceRepository.updateContact(
      id,
      tenantId,
      body,
    );
    return NextResponse.json({ data: contact });
  } catch {
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    await contactIntelligenceRepository.deleteContact(id, tenantId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 },
    );
  }
}
