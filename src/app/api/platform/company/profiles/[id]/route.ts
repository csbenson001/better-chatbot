import { companyIntelligenceRepository } from "lib/db/repository";
import { CompanyProfileUpdateSchema } from "app-types/company-intelligence";
import { buildCompanyContext } from "lib/platform/company-intelligence/research-engine";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;

    const context = await buildCompanyContext(id, tenantId);
    if (!context) {
      return Response.json(
        { error: "Company profile not found" },
        { status: 404 },
      );
    }

    return Response.json(context);
  } catch (error) {
    console.error("Failed to fetch company profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;
    const body = await request.json();

    const data = CompanyProfileUpdateSchema.parse(body);

    const profile = await companyIntelligenceRepository.updateCompanyProfile(
      id,
      tenantId,
      data,
    );

    return Response.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to update company profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;

    await companyIntelligenceRepository.deleteCompanyProfile(id, tenantId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete company profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
