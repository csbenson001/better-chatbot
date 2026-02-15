import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { detectBuyingSignals } from "lib/platform/sales-intelligence/signal-detector";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const prospectId = searchParams.get("prospectId") || undefined;
    const signalType = searchParams.get("signalType") || undefined;
    const minScore = searchParams.get("minScore")
      ? Number(searchParams.get("minScore"))
      : undefined;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : undefined;

    const signals =
      await salesIntelligenceRepository.selectBuyingSignalsByTenantId(
        tenantId,
        { prospectId, signalType, minScore, limit },
      );

    return NextResponse.json({ data: signals });
  } catch (error) {
    console.error("Failed to fetch buying signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch buying signals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const { prospectId } = body;

    if (!prospectId) {
      return NextResponse.json(
        { error: "prospectId is required" },
        { status: 400 },
      );
    }

    // Detect buying signals using the signal detector
    const detectedSignals = await detectBuyingSignals({
      tenantId,
      prospectId,
    });

    // Store detected signals in the database
    const storedSignals: Awaited<
      ReturnType<typeof salesIntelligenceRepository.insertBuyingSignal>
    >[] = [];
    for (const signal of detectedSignals) {
      const stored = await salesIntelligenceRepository.insertBuyingSignal({
        tenantId,
        prospectId,
        signalType: signal.signalType,
        title: signal.title,
        description: signal.description,
        compositeScore: signal.compositeScore,
        componentSignals: signal.componentSignals,
        recommendedAction: signal.recommendedAction,
        optimalTiming: signal.optimalTiming || undefined,
      });
      storedSignals.push(stored);
    }

    return NextResponse.json(
      {
        data: {
          detected: detectedSignals.length,
          signals: storedSignals,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to detect buying signals:", error);
    return NextResponse.json(
      { error: "Failed to detect buying signals" },
      { status: 500 },
    );
  }
}
