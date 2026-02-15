import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;

    const workflow = await salesIntelligenceRepository.selectWorkflowById(
      id,
      tenantId,
    );
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // Include recent runs
    const recentRuns =
      await salesIntelligenceRepository.selectWorkflowRunsByWorkflowId(
        id,
        tenantId,
        10,
      );

    return NextResponse.json({
      data: { ...workflow, recentRuns },
    });
  } catch (error) {
    console.error("Failed to fetch workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;
    const body = await request.json();

    const workflow = await salesIntelligenceRepository.updateWorkflow(
      id,
      tenantId,
      body,
    );

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: workflow });
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;

    await salesIntelligenceRepository.deleteWorkflow(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    );
  }
}
