import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 },
      );
    }

    const source = await prospectingRepository.selectProspectSourceById(
      sourceId,
      tenantId,
    );
    if (!source) {
      return NextResponse.json(
        { error: "Prospect source not found" },
        { status: 404 },
      );
    }

    let scanResult: {
      facilitiesFound?: number;
      prospectsCreated?: number;
      prospectsUpdated?: number;
      resultsFound?: number;
      errors?: string[];
    } = {};

    try {
      if (source.type === "epa-echo") {
        const { scanEpaEcho } = await import(
          "lib/platform/prospecting/epa-echo-scanner"
        );
        scanResult = await scanEpaEcho({
          tenantId,
          sourceId: source.id,
          state: (source.filters?.state as string) ?? undefined,
          program: (source.filters?.programs as string[]) ?? undefined,
        });
      } else if (source.type === "web-scrape") {
        const { scanWebSource } = await import(
          "lib/platform/prospecting/web-scanner"
        );
        const results = await scanWebSource(
          {
            url: source.baseUrl ?? "",
            name: source.name,
            type: "government-database",
          },
          { limit: 50 },
        );
        scanResult = { resultsFound: results.length };
      } else {
        return NextResponse.json(
          {
            error: `Scanner not implemented for source type: ${source.type}`,
          },
          { status: 501 },
        );
      }
    } catch (scanError) {
      console.error("Scanner module not available:", scanError);
      return NextResponse.json(
        {
          error: "Scanner module not available",
          details:
            scanError instanceof Error
              ? scanError.message
              : "Unknown scanner error",
        },
        { status: 501 },
      );
    }

    await prospectingRepository.updateProspectSource(sourceId, tenantId, {
      lastScanAt: new Date(),
    });

    return NextResponse.json({
      data: {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        scanResult,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to trigger prospect scan:", error);
    return NextResponse.json(
      { error: "Failed to trigger prospect scan" },
      { status: 500 },
    );
  }
}
