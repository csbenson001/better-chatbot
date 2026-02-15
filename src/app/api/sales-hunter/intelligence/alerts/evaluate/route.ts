import { NextResponse } from "next/server";
import { salesIntelligenceRepository } from "lib/db/repository";
import { evaluateAlertRules } from "lib/platform/sales-intelligence/alert-engine";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;

    // Get all active alert rules for this tenant
    const rules =
      await salesIntelligenceRepository.selectAlertRulesByTenantId(tenantId);

    const enabledRules = rules.filter((r) => r.enabled !== false);

    if (enabledRules.length === 0) {
      return NextResponse.json({
        data: { alertsCreated: 0, message: "No enabled alert rules found" },
      });
    }

    // Evaluate rules against current data
    const generatedAlerts = await evaluateAlertRules({
      tenantId,
      rules: enabledRules.map((r) => ({
        id: r.id,
        category: r.category,
        severity: r.severity,
        conditions:
          (r.conditions as Array<{
            condition: string;
            parameters: Record<string, unknown>;
          }>) || [],
      })),
    });

    // Create alert records for each match
    const createdAlerts: Awaited<
      ReturnType<typeof salesIntelligenceRepository.insertAlert>
    >[] = [];
    for (const alert of generatedAlerts) {
      const created = await salesIntelligenceRepository.insertAlert({
        tenantId,
        prospectId: alert.prospectId || null,
        category: alert.category,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        sourceUrl: alert.sourceUrl,
        sourceType: alert.sourceType,
        actionItems: alert.actionItems,
        metadata: alert.metadata,
      });
      createdAlerts.push(created);
    }

    return NextResponse.json({
      data: {
        alertsCreated: createdAlerts.length,
        rulesEvaluated: enabledRules.length,
        alerts: createdAlerts,
      },
    });
  } catch (error) {
    console.error("Failed to evaluate alert rules:", error);
    return NextResponse.json(
      { error: "Failed to evaluate alert rules" },
      { status: 500 },
    );
  }
}
