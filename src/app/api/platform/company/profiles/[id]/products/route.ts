import { companyIntelligenceRepository } from "lib/db/repository";
import { ProductCreateSchema } from "app-types/company-intelligence";
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

    const products =
      await companyIntelligenceRepository.selectProductsByCompanyId(
        id,
        tenantId,
      );

    return Response.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
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

    const data = ProductCreateSchema.parse({
      ...body,
      tenantId,
      companyId: id,
    });

    const product = await companyIntelligenceRepository.insertProduct(data);

    return Response.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create product:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
