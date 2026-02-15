import { stateResearchRepository } from "lib/db/repository";
import { STATE_REGULATORY_SOURCES } from "lib/platform/state-research/state-sources-registry";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

function getTenantId(request: Request): string {
  return request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);

    // Load existing sources to check for duplicates by URL
    const existingSources =
      await stateResearchRepository.selectStateSourcesByTenantId(tenantId);
    const existingUrls = new Set(existingSources.map((s) => s.url));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const seed of STATE_REGULATORY_SOURCES) {
      if (existingUrls.has(seed.url)) {
        skipped.push(seed.name);
        continue;
      }

      const source = await stateResearchRepository.insertStateSource({
        tenantId,
        state: seed.state,
        name: seed.name,
        sourceType: seed.sourceType as any,
        agencyName: seed.agencyName,
        url: seed.url,
        searchUrl: seed.searchUrl,
        apiEndpoint: seed.apiEndpoint,
        dataFormat: seed.dataFormat as any,
        capabilities: seed.capabilities,
        scrapingConfig: {},
        enabled: true,
        metadata: seed.metadata,
      });

      created.push(source.name);
    }

    return Response.json(
      {
        message: `Seeded ${created.length} state sources, skipped ${skipped.length} duplicates`,
        created: created.length,
        skipped: skipped.length,
        skippedNames: skipped,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to seed state sources:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
