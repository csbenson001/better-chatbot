import { stateResearchRepository } from "lib/db/repository";
import { StateSourceCreateSchema } from "app-types/state-research";
import type { StateSourceType } from "app-types/state-research";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);

    const state = searchParams.get("state") || undefined;
    const sourceType = (searchParams.get("sourceType") || undefined) as
      | StateSourceType
      | undefined;
    const enabledParam = searchParams.get("enabled");
    const enabled = enabledParam !== null ? enabledParam === "true" : undefined;

    const sources = await stateResearchRepository.selectStateSourcesByTenantId(
      tenantId,
      {
        state,
        sourceType,
        enabled,
      },
    );

    return Response.json(sources);
  } catch (error) {
    console.error("Failed to fetch state sources:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();

    const data = StateSourceCreateSchema.parse({
      ...body,
      tenantId,
    });

    const source = await stateResearchRepository.insertStateSource(data);

    return Response.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create state source:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
