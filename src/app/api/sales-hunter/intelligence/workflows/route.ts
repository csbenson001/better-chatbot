import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    const workflows =
      await salesIntelligenceRepository.selectWorkflowsByTenantId(tenantId);

    return NextResponse.json({ data: workflows });
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const { name, description, steps, schedule } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const workflow = await salesIntelligenceRepository.insertWorkflow({
      tenantId,
      name,
      description,
      steps,
      schedule,
    });

    return NextResponse.json({ data: workflow }, { status: 201 });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}
