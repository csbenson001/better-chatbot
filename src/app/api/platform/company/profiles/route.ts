import { companyIntelligenceRepository } from "lib/db/repository";
import { CompanyProfileCreateSchema } from "app-types/company-intelligence";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);

    const options: {
      isClientCompany?: boolean;
      industry?: string;
      limit?: number;
      offset?: number;
    } = {};

    const isClientCompany = searchParams.get("isClientCompany");
    if (isClientCompany != null) {
      options.isClientCompany = isClientCompany === "true";
    }

    const industry = searchParams.get("industry");
    if (industry) {
      options.industry = industry;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get("offset");
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    const profiles =
      await companyIntelligenceRepository.selectCompanyProfilesByTenantId(
        tenantId,
        options,
      );

    return Response.json(profiles);
  } catch (error) {
    console.error("Failed to fetch company profiles:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();

    const data = CompanyProfileCreateSchema.parse({
      ...body,
      tenantId,
    });

    const profile =
      await companyIntelligenceRepository.insertCompanyProfile(data);

    return Response.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create company profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
