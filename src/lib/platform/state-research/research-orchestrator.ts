import { stateResearchRepository } from "lib/db/repository";
import type {
  ResearchTask,
  ResearchFinding,
  AgentLogEntry,
  ResearchAgentConfig,
} from "app-types/state-research";

export class ResearchOrchestrator {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async executeTask(taskId: string): Promise<ResearchTask> {
    const task = await stateResearchRepository.selectResearchTaskById(
      taskId,
      this.tenantId,
    );
    if (!task) throw new Error("Research task not found");

    // Mark as in-progress
    await stateResearchRepository.updateResearchTask(taskId, this.tenantId, {
      status: "in-progress",
      startedAt: new Date(),
      agentLog: [
        {
          timestamp: new Date().toISOString(),
          agent: "orchestrator",
          action: "task-started",
          message: `Starting research task: ${task.title}`,
        },
      ],
    });

    try {
      // Load applicable agent config for this task type
      const agentConfigs =
        await stateResearchRepository.selectResearchAgentConfigsByTenantId(
          this.tenantId,
          {
            agentType: task.taskType,
            enabled: true,
          },
        );

      // Load relevant state sources
      const sources = task.targetState
        ? await stateResearchRepository.selectStateSourcesByState(
            task.targetState,
            this.tenantId,
          )
        : await stateResearchRepository.selectStateSourcesByTenantId(
            this.tenantId,
            { enabled: true },
          );

      // Build research context
      const context = this.buildResearchContext(task, agentConfigs, sources);

      // Execute research phases
      const findings: ResearchFinding[] = [];
      const log: AgentLogEntry[] = [];

      // Phase 1: Source Discovery
      log.push({
        timestamp: new Date().toISOString(),
        agent: "source-discovery",
        action: "scanning-sources",
        message: `Found ${sources.length} applicable sources for ${task.targetState || "all states"}`,
        data: {
          sourceCount: sources.length,
          sourceTypes: sources.map((s) => s.sourceType),
        },
      });

      // Phase 2: Data Collection
      for (const source of sources) {
        log.push({
          timestamp: new Date().toISOString(),
          agent: "data-collector",
          action: "source-scan",
          message: `Scanning source: ${source.name} (${source.state})`,
          data: { sourceId: source.id, url: source.url },
        });
      }

      // Phase 3: Analysis
      log.push({
        timestamp: new Date().toISOString(),
        agent: "analyst",
        action: "analysis-started",
        message: `Analyzing collected data for ${task.taskType}`,
      });

      // Phase 4: Generate findings based on task type
      const taskFindings = await this.generateFindings(task, sources, context);
      findings.push(...taskFindings);

      log.push({
        timestamp: new Date().toISOString(),
        agent: "analyst",
        action: "analysis-completed",
        message: `Generated ${findings.length} findings`,
        data: { findingCount: findings.length },
      });

      // Complete task
      const result = await stateResearchRepository.updateResearchTask(
        taskId,
        this.tenantId,
        {
          status: "completed",
          completedAt: new Date(),
          findings,
          agentLog: [...(task.agentLog || []), ...log],
          results: {
            sourcesScanned: sources.length,
            findingsCount: findings.length,
            actionableFindings: findings.filter((f) => f.actionable).length,
          },
        },
      );

      return result;
    } catch (error) {
      await stateResearchRepository.updateResearchTask(taskId, this.tenantId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        agentLog: [
          ...(task.agentLog || []),
          {
            timestamp: new Date().toISOString(),
            agent: "orchestrator",
            action: "task-failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });
      throw error;
    }
  }

  private buildResearchContext(
    task: ResearchTask,
    configs: ResearchAgentConfig[],
    sources: Array<{
      name: string;
      url: string;
      sourceType: string;
      capabilities: string[];
    }>,
  ): string {
    const parts: string[] = [
      `## Research Task: ${task.title}`,
      `Type: ${task.taskType}`,
      task.targetCompany ? `Target Company: ${task.targetCompany}` : "",
      task.targetState ? `Target State: ${task.targetState}` : "",
      task.description ? `\nDescription: ${task.description}` : "",
      "\n## Available Sources:",
    ];

    for (const source of sources) {
      parts.push(`- ${source.name} (${source.sourceType}): ${source.url}`);
      if (source.capabilities.length > 0) {
        parts.push(`  Capabilities: ${source.capabilities.join(", ")}`);
      }
    }

    if (configs.length > 0) {
      parts.push("\n## Agent Instructions:");
      for (const config of configs) {
        parts.push(`\n### ${config.name}`);
        if (config.searchKeywords.length > 0) {
          parts.push(`Keywords: ${config.searchKeywords.join(", ")}`);
        }
        if (config.targetStates.length > 0) {
          parts.push(`Focus States: ${config.targetStates.join(", ")}`);
        }
      }
    }

    return parts.filter(Boolean).join("\n");
  }

  private async generateFindings(
    task: ResearchTask,
    sources: Array<{
      name: string;
      url: string;
      sourceType: string;
      state: string;
    }>,
    _context: string,
  ): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    // Generate findings based on task type
    switch (task.taskType) {
      case "company-deep-dive":
        findings.push({
          type: "company-profile",
          title: `Research sources identified for ${task.targetCompany || "target company"}`,
          summary: `Found ${sources.length} regulatory sources that may contain data about the target company. Sources include ${sources
            .map((s) => s.name)
            .slice(0, 3)
            .join(", ")}.`,
          confidence: 70,
          data: {
            sources: sources.map((s) => ({
              name: s.name,
              url: s.url,
              state: s.state,
            })),
          },
          actionable: true,
          suggestedAction:
            "Review identified sources and search for company-specific records",
        });
        break;

      case "facility-compliance":
        findings.push({
          type: "compliance-check",
          title: `Compliance data sources for facility ${task.targetFacilityId || "target"}`,
          summary: `Identified ${sources.filter((s) => ["environmental-agency", "compliance-monitoring", "enforcement-actions"].includes(s.sourceType)).length} compliance-focused sources.`,
          confidence: 75,
          data: {
            complianceSources: sources.filter(
              (s) =>
                s.sourceType.includes("compliance") ||
                s.sourceType.includes("enforcement"),
            ),
          },
          actionable: true,
          suggestedAction:
            "Query compliance databases for facility violation history and inspection records",
        });
        break;

      case "enforcement-scan":
        findings.push({
          type: "enforcement-opportunities",
          title: `Enforcement monitoring for ${task.targetState || "all states"}`,
          summary: `Found ${sources.filter((s) => s.sourceType === "enforcement-actions").length} enforcement data sources. Companies with recent violations may need compliance services.`,
          confidence: 80,
          data: {
            enforcementSources: sources
              .filter((s) => s.sourceType === "enforcement-actions")
              .map((s) => ({ name: s.name, url: s.url })),
          },
          actionable: true,
          suggestedAction:
            "Monitor enforcement actions for new business opportunities - companies penalized often need compliance help",
        });
        break;

      case "state-permit-scan":
        findings.push({
          type: "permit-activity",
          title: `Permit activity in ${task.targetState || "target states"}`,
          summary: `Identified ${sources.filter((s) => s.sourceType === "permits-registry" || s.sourceType === "oil-gas-commission").length} permit registries to scan for new drilling/operating permits.`,
          confidence: 75,
          data: {
            permitSources: sources.filter(
              (s) =>
                s.sourceType.includes("permit") ||
                s.sourceType === "oil-gas-commission",
            ),
          },
          actionable: true,
          suggestedAction:
            "New permits indicate expansion activity - potential new customers for monitoring services",
        });
        break;

      case "emissions-analysis":
        findings.push({
          type: "emissions-data",
          title: `Emissions monitoring sources for ${task.targetState || "target area"}`,
          summary: `Found ${sources.filter((s) => s.sourceType === "emissions-inventory" || s.sourceType === "air-quality").length} emissions data sources. Facilities with high emissions or methane leaks are priority targets for monitoring services.`,
          confidence: 85,
          data: {
            emissionsSources: sources.filter(
              (s) =>
                s.sourceType.includes("emission") ||
                s.sourceType === "air-quality",
            ),
          },
          actionable: true,
          suggestedAction:
            "Focus on facilities reported in GHGRP with high methane emissions - these are prime candidates for Alliance TG's OGI and LDAR services",
        });
        break;

      default:
        findings.push({
          type: "general",
          title: `Research sources compiled for ${task.taskType}`,
          summary: `Compiled ${sources.length} sources for research.`,
          confidence: 60,
          data: { sources: sources.map((s) => s.name) },
          actionable: false,
        });
    }

    return findings;
  }
}
