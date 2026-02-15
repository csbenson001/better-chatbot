import { stateResearchRepository } from "lib/db/repository";
import { DEFAULT_RESEARCH_AGENTS } from "lib/platform/state-research/default-agent-configs";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);

    // Load existing agent configs to avoid duplicates
    const existingConfigs =
      await stateResearchRepository.selectResearchAgentConfigsByTenantId(
        tenantId,
      );
    const existingTypes = new Set(existingConfigs.map((c) => c.agentType));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const seed of DEFAULT_RESEARCH_AGENTS) {
      if (existingTypes.has(seed.agentType)) {
        skipped.push(seed.name);
        continue;
      }

      const config = await stateResearchRepository.insertResearchAgentConfig({
        tenantId,
        agentType: seed.agentType,
        name: seed.name,
        systemPrompt: seed.systemPrompt,
        targetStates: seed.targetStates,
        targetIndustries: seed.targetIndustries,
        enabledSources: seed.enabledSources,
        searchKeywords: seed.searchKeywords,
        filters: seed.filters,
        schedule: seed.schedule ?? undefined,
        enabled: seed.enabled,
        metadata: seed.metadata,
      });

      created.push(config.name);
    }

    return Response.json(
      {
        message: `Seeded ${created.length} research agents, skipped ${skipped.length} duplicates`,
        created: created.length,
        skipped: skipped.length,
        skippedNames: skipped,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to seed research agents:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
