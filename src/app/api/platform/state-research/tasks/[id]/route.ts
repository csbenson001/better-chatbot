import { stateResearchRepository } from "lib/db/repository";
import { ResearchOrchestrator } from "lib/platform/state-research/research-orchestrator";
import type {
  ResearchTaskStatus,
  ResearchFinding,
  AgentLogEntry,
} from "app-types/state-research";

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

    const task = await stateResearchRepository.selectResearchTaskById(
      id,
      tenantId,
    );
    if (!task) {
      return Response.json(
        { error: "Research task not found" },
        { status: 404 },
      );
    }

    return Response.json(task);
  } catch (error) {
    console.error("Failed to fetch research task:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;
    const body = await request.json();

    // Check if this is a re-run request
    if (body.action === "rerun") {
      // Reset the task status and re-execute
      await stateResearchRepository.updateResearchTask(id, tenantId, {
        status: "pending" as ResearchTaskStatus,
        findings: [] as ResearchFinding[],
        agentLog: [
          {
            timestamp: new Date().toISOString(),
            agent: "orchestrator",
            action: "task-rerun",
            message: "Task queued for re-execution",
          },
        ] as AgentLogEntry[],
        results: undefined,
        errorMessage: null,
        startedAt: undefined,
        completedAt: undefined,
      });

      const orchestrator = new ResearchOrchestrator(tenantId);
      orchestrator.executeTask(id).catch((err) => {
        console.error(`Research task ${id} re-run failed:`, err);
      });

      const task = await stateResearchRepository.selectResearchTaskById(
        id,
        tenantId,
      );
      return Response.json(task);
    }

    // Standard update
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.results) updateData.results = body.results;
    if (body.findings) updateData.findings = body.findings;
    if (body.agentLog) updateData.agentLog = body.agentLog;
    if (body.errorMessage !== undefined)
      updateData.errorMessage = body.errorMessage;

    const task = await stateResearchRepository.updateResearchTask(
      id,
      tenantId,
      updateData as any,
    );

    return Response.json(task);
  } catch (error) {
    console.error("Failed to update research task:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
