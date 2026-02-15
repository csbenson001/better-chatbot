import { companyIntelligenceRepository } from "lib/db/repository";
import { ValueChainCreateSchema } from "app-types/company-intelligence";
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

    const valueChain =
      await companyIntelligenceRepository.selectValueChainByCompanyId(
        id,
        tenantId,
      );

    return Response.json(valueChain);
  } catch (error) {
    console.error("Failed to fetch value chain:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;
    const body = await request.json();

    const data = ValueChainCreateSchema.parse({
      ...body,
      tenantId,
      companyId: id,
    });

    const entry = await companyIntelligenceRepository.insertValueChain(data);

    return Response.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create value chain entry:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
