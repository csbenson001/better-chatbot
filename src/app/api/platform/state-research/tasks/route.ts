import { stateResearchRepository } from "lib/db/repository";
import { ResearchTaskCreateSchema } from "app-types/state-research";
import type {
  ResearchTaskStatus,
  ResearchTaskType,
} from "app-types/state-research";
import { ResearchOrchestrator } from "lib/platform/state-research/research-orchestrator";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);

    const status = (searchParams.get("status") || undefined) as
      | ResearchTaskStatus
      | undefined;
    const taskType = (searchParams.get("taskType") || undefined) as
      | ResearchTaskType
      | undefined;
    const targetState = searchParams.get("targetState") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const tasks = await stateResearchRepository.selectResearchTasksByTenantId(
      tenantId,
      {
        status,
        taskType,
        targetState,
        limit,
        offset,
      },
    );

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to fetch research tasks:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();

    const { executeImmediately, ...taskData } = body;

    const data = ResearchTaskCreateSchema.parse({
      ...taskData,
      tenantId,
    });

    const task = await stateResearchRepository.insertResearchTask(data);

    // If executeImmediately is true, fire the orchestrator (don't await)
    if (executeImmediately) {
      const orchestrator = new ResearchOrchestrator(tenantId);
      orchestrator.executeTask(task.id).catch((err) => {
        console.error(`Research task ${task.id} failed:`, err);
      });
    }

    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create research task:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
