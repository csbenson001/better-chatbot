import { stateResearchRepository } from "lib/db/repository";
import { ResearchAgentConfigCreateSchema } from "app-types/state-research";
import type { ResearchTaskType } from "app-types/state-research";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);

    const agentType = (searchParams.get("agentType") || undefined) as
      | ResearchTaskType
      | undefined;
    const enabledParam = searchParams.get("enabled");
    const enabled = enabledParam !== null ? enabledParam === "true" : undefined;

    const configs =
      await stateResearchRepository.selectResearchAgentConfigsByTenantId(
        tenantId,
        {
          agentType,
          enabled,
        },
      );

    return Response.json(configs);
  } catch (error) {
    console.error("Failed to fetch research agent configs:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();

    const data = ResearchAgentConfigCreateSchema.parse({
      ...body,
      tenantId,
    });

    const config =
      await stateResearchRepository.insertResearchAgentConfig(data);

    return Response.json(config, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create research agent config:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
