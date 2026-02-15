import { stateResearchRepository } from "lib/db/repository";
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

    const config = await stateResearchRepository.selectResearchAgentConfigById(
      id,
      tenantId,
    );
    if (!config) {
      return Response.json(
        { error: "Research agent config not found" },
        { status: 404 },
      );
    }

    return Response.json(config);
  } catch (error) {
    console.error("Failed to fetch research agent config:", error);
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

    const config = await stateResearchRepository.updateResearchAgentConfig(
      id,
      tenantId,
      body,
    );

    return Response.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to update research agent config:", error);
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

    await stateResearchRepository.deleteResearchAgentConfig(id, tenantId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete research agent config:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
