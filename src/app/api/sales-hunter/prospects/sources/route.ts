import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";
import { ProspectSourceCreateSchema } from "app-types/prospecting";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    const sources =
      await prospectingRepository.selectProspectSourcesByTenantId(tenantId);

    return NextResponse.json({ data: sources });
  } catch (error) {
    console.error("Failed to fetch prospect sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospect sources" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const data = ProspectSourceCreateSchema.parse({ ...body, tenantId });
    const source = await prospectingRepository.insertProspectSource(data);

    return NextResponse.json({ data: source }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid source data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create prospect source:", error);
    return NextResponse.json(
      { error: "Failed to create prospect source" },
      { status: 500 },
    );
  }
}
