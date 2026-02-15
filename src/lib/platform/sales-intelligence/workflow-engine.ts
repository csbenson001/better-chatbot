export type WorkflowStepType =
  | "discover-prospects"
  | "scan-sources"
  | "extract-contacts"
  | "enrich-data"
  | "score-prospects"
  | "generate-brief"
  | "send-alert"
  | "qualify-lead"
  | "custom";

export interface WorkflowExecutionContext {
  tenantId: string;
  workflowId: string;
  runId: string;
  stepResults: Map<number, StepResult>;
}

export interface StepResult {
  status: "completed" | "failed" | "skipped";
  result?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt: string;
}

export interface WorkflowStepHandler {
  execute(
    ctx: WorkflowExecutionContext,
    config: Record<string, unknown>,
  ): Promise<StepResult>;
}

// Step handlers registry
const stepHandlers: Record<string, WorkflowStepHandler> = {
  "discover-prospects": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      // Discovery step would search for new prospects in configured sources
      const industry = (config.industry as string) || undefined;
      const state = (config.state as string) || undefined;
      return {
        status: "completed",
        result: {
          prospectsFound: 0,
          industry,
          state,
          message:
            "Prospect discovery configured. Connect data sources to begin scanning.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "scan-sources": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const sourceTypes = (config.sourceTypes as string[]) || [];
      return {
        status: "completed",
        result: {
          sourcesScanned: sourceTypes.length,
          sourceTypes,
          message: "Source scanning configured.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "extract-contacts": {
    async execute(ctx, config) {
      const started = new Date().toISOString();
      const previousStep = ctx.stepResults.get(
        (config.fromStep as number) || 0,
      );
      return {
        status: "completed",
        result: {
          contactsExtracted: 0,
          fromPreviousStep: !!previousStep,
          message: "Contact extraction ready.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "enrich-data": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const enrichSources = (config.sources as string[]) || [
        "company-website",
        "linkedin",
      ];
      return {
        status: "completed",
        result: {
          enrichmentSources: enrichSources,
          recordsEnriched: 0,
          message: "Data enrichment configured.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "score-prospects": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const scoringCriteria = (config.criteria as string[]) || [
        "industry-fit",
        "compliance-risk",
        "company-size",
      ];
      return {
        status: "completed",
        result: {
          scoringCriteria,
          prospectsScored: 0,
          message: "Scoring engine ready.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "generate-brief": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const briefType = (config.briefType as string) || "prospect-overview";
      return {
        status: "completed",
        result: {
          briefType,
          briefsGenerated: 0,
          message: "Brief generation ready.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "send-alert": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const channels = (config.channels as string[]) || ["in-app"];
      return {
        status: "completed",
        result: {
          channels,
          alertsSent: 0,
          message: "Alert delivery configured.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  "qualify-lead": {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      const minScore = (config.minScore as number) || 60;
      return {
        status: "completed",
        result: {
          minScore,
          leadsQualified: 0,
          message: "Lead qualification ready.",
        },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
  custom: {
    async execute(_ctx, config) {
      const started = new Date().toISOString();
      return {
        status: "completed",
        result: { config, message: "Custom step executed." },
        startedAt: started,
        completedAt: new Date().toISOString(),
      };
    },
  },
};

// Execute a single workflow step
export async function executeWorkflowStep(
  ctx: WorkflowExecutionContext,
  stepType: WorkflowStepType,
  config: Record<string, unknown>,
): Promise<StepResult> {
  const handler = stepHandlers[stepType];
  if (!handler) {
    return {
      status: "failed",
      error: `Unknown step type: ${stepType}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  try {
    return await handler.execute(ctx, config);
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }
}

// Execute a complete workflow
export async function executeWorkflow(
  tenantId: string,
  workflowId: string,
  runId: string,
  steps: Array<{
    stepType: WorkflowStepType;
    name: string;
    config: Record<string, unknown>;
  }>,
): Promise<
  Array<{
    stepIndex: number;
    stepType: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
    startedAt: string;
    completedAt: string;
  }>
> {
  const ctx: WorkflowExecutionContext = {
    tenantId,
    workflowId,
    runId,
    stepResults: new Map(),
  };

  const results: Array<{
    stepIndex: number;
    stepType: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
    startedAt: string;
    completedAt: string;
  }> = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const result = await executeWorkflowStep(ctx, step.stepType, step.config);
    ctx.stepResults.set(i, result);
    results.push({
      stepIndex: i,
      stepType: step.stepType,
      status: result.status,
      result: result.result,
      error: result.error,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    });

    // Stop on failure unless configured otherwise
    if (result.status === "failed") break;
  }

  return results;
}

// Get available step types with descriptions
export function getAvailableStepTypes(): Array<{
  type: WorkflowStepType;
  name: string;
  description: string;
}> {
  return [
    {
      type: "discover-prospects",
      name: "Discover Prospects",
      description: "Search for new prospects in configured data sources",
    },
    {
      type: "scan-sources",
      name: "Scan Sources",
      description: "Scan regulatory and business data sources for updates",
    },
    {
      type: "extract-contacts",
      name: "Extract Contacts",
      description: "Extract contact information from discovered data",
    },
    {
      type: "enrich-data",
      name: "Enrich Data",
      description: "Enrich prospect and contact data from multiple sources",
    },
    {
      type: "score-prospects",
      name: "Score Prospects",
      description: "Score prospects based on fit, intent, and signals",
    },
    {
      type: "generate-brief",
      name: "Generate Brief",
      description: "Auto-generate sales briefs for qualified prospects",
    },
    {
      type: "send-alert",
      name: "Send Alert",
      description: "Send notifications about important findings",
    },
    {
      type: "qualify-lead",
      name: "Qualify Lead",
      description: "Evaluate and qualify leads based on scoring criteria",
    },
    {
      type: "custom",
      name: "Custom Step",
      description: "Execute a custom workflow step",
    },
  ];
}
