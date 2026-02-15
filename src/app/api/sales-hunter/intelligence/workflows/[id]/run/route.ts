import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { executeWorkflow } from "lib/platform/sales-intelligence/workflow-engine";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { id } = await params;

    // Fetch the workflow
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

    // Create a run record
    const run = await salesIntelligenceRepository.insertWorkflowRun({
      workflowId: id,
      tenantId,
    });

    // Mark run as started
    await salesIntelligenceRepository.updateWorkflowRun(run.id, tenantId, {
      status: "running",
      startedAt: new Date(),
    });

    try {
      // Execute the workflow steps
      const steps =
        (workflow.steps as Array<{
          stepType: any;
          name: string;
          config: Record<string, unknown>;
        }>) || [];

      const stepResults = await executeWorkflow(tenantId, id, run.id, steps);

      const hasFailure = stepResults.some((r) => r.status === "failed");

      // Update run record with results
      const updatedRun = await salesIntelligenceRepository.updateWorkflowRun(
        run.id,
        tenantId,
        {
          status: hasFailure ? "failed" : "completed",
          stepResults: stepResults as unknown[],
          completedAt: new Date(),
          currentStep: stepResults.length,
          errorMessage: hasFailure
            ? stepResults.find((r) => r.status === "failed")?.error
            : undefined,
        },
      );

      // Update workflow's last run reference
      await salesIntelligenceRepository.updateWorkflow(id, tenantId, {
        lastRunId: run.id,
      });

      return NextResponse.json({
        data: { run: updatedRun, stepResults },
      });
    } catch (execError) {
      // Mark run as failed
      await salesIntelligenceRepository.updateWorkflowRun(run.id, tenantId, {
        status: "failed",
        completedAt: new Date(),
        errorMessage:
          execError instanceof Error
            ? execError.message
            : "Unknown execution error",
      });

      throw execError;
    }
  } catch (error) {
    console.error("Failed to execute workflow:", error);
    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 },
    );
  }
}
