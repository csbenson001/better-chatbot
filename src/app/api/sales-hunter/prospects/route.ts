import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";
import { ProspectCreateSchema } from "app-types/prospecting";
import type { ProspectStatus } from "app-types/prospecting";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as ProspectStatus | null;
    const industry = searchParams.get("industry") || undefined;
    const minFitScore = searchParams.get("minFitScore")
      ? Number(searchParams.get("minFitScore"))
      : undefined;
    const minIntentScore = searchParams.get("minIntentScore")
      ? Number(searchParams.get("minIntentScore"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : 50;
    const offset = searchParams.get("offset")
      ? Math.max(0, Number(searchParams.get("offset")))
      : 0;

    const prospects = await prospectingRepository.selectProspectsByTenantId(
      tenantId,
      {
        status: status || undefined,
        industry,
        minFitScore,
        minIntentScore,
        limit,
        offset,
      },
    );

    return NextResponse.json({ data: prospects });
  } catch (error) {
    console.error("Failed to fetch prospects:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const data = ProspectCreateSchema.parse({ ...body, tenantId });
    const prospect = await prospectingRepository.insertProspect(data);

    return NextResponse.json({ data: prospect }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid prospect data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create prospect:", error);
    return NextResponse.json(
      { error: "Failed to create prospect" },
      { status: 500 },
    );
  }
}
