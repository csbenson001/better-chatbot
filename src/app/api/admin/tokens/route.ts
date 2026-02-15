import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";

export async function GET(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";

    const { searchParams } = new URL(request.url);

    // Default to current month
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const periodStart = searchParams.get("periodStart")
      ? new Date(searchParams.get("periodStart")!)
      : defaultStart;
    const periodEnd = searchParams.get("periodEnd")
      ? new Date(searchParams.get("periodEnd")!)
      : defaultEnd;

    const summary = await rbacRepository.selectTokenUsageSummary(
      tenantId,
      periodStart,
      periodEnd,
    );

    // Compute aggregated totals
    const totals = summary.reduce(
      (acc, row) => ({
        totalInput: acc.totalInput + row.totalInput,
        totalOutput: acc.totalOutput + row.totalOutput,
        totalTokens: acc.totalTokens + row.totalTokens,
        totalCostCents: acc.totalCostCents + row.totalCostCents,
        totalRequests: acc.totalRequests + row.requestCount,
      }),
      {
        totalInput: 0,
        totalOutput: 0,
        totalTokens: 0,
        totalCostCents: 0,
        totalRequests: 0,
      },
    );

    return NextResponse.json({
      data: {
        summary,
        totals,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch token usage" },
      { status: 500 },
    );
  }
}
