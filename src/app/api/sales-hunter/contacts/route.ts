import { NextResponse } from "next/server";
import { contactIntelligenceRepository } from "lib/db/repository";
import { ContactCreateSchema } from "app-types/contact-intelligence";

export async function GET(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const { searchParams } = new URL(request.url);

    const contacts =
      await contactIntelligenceRepository.selectContactsByTenantId(tenantId, {
        status: (searchParams.get("status") as any) || undefined,
        role: (searchParams.get("role") as any) || undefined,
        companyId: searchParams.get("companyId") || undefined,
        prospectId: searchParams.get("prospectId") || undefined,
        leadId: searchParams.get("leadId") || undefined,
        minConfidence: searchParams.get("minConfidence")
          ? Number(searchParams.get("minConfidence"))
          : undefined,
        limit: searchParams.get("limit")
          ? Number(searchParams.get("limit"))
          : 50,
        offset: searchParams.get("offset")
          ? Number(searchParams.get("offset"))
          : 0,
      });

    return NextResponse.json({ data: contacts });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = ContactCreateSchema.parse({ ...body, tenantId });
    const contact = await contactIntelligenceRepository.insertContact(data);
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid contact data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 },
    );
  }
}
