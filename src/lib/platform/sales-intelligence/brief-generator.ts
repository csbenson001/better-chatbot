import {
  companyIntelligenceRepository,
  prospectingRepository,
  contactIntelligenceRepository,
} from "lib/db/repository";

export interface BriefGeneratorInput {
  tenantId: string;
  prospectId?: string;
  companyId?: string;
  briefType: string;
}

export interface GeneratedBrief {
  title: string;
  sections: Array<{
    title: string;
    content: string;
    dataSource?: string;
    confidence?: number;
  }>;
  content: string;
}

// Gathers all context about a prospect/company and generates a structured brief
export async function generateSalesBrief(
  input: BriefGeneratorInput,
): Promise<GeneratedBrief> {
  // Gather context from multiple repositories
  const sections: Array<{
    title: string;
    content: string;
    dataSource?: string;
    confidence?: number;
  }> = [];
  let companyName = "Unknown Company";

  // 1. Prospect data
  if (input.prospectId) {
    const prospect = await prospectingRepository.selectProspectById(
      input.prospectId,
      input.tenantId,
    );
    if (prospect) {
      companyName = prospect.companyName;
      sections.push({
        title: "Company Overview",
        content: buildProspectOverview(prospect),
        dataSource: "prospect-database",
        confidence: 85,
      });

      // Get signals
      const signals = await prospectingRepository.selectSignalsByProspectId(
        input.prospectId,
        input.tenantId,
      );
      if (signals.length > 0) {
        sections.push({
          title: "Recent Signals & Activity",
          content: signals
            .map(
              (s) =>
                `- **${s.title}** (${s.signalType}, strength: ${s.strength}): ${s.description || "No details"}`,
            )
            .join("\n"),
          dataSource: "signal-detection",
          confidence: 80,
        });
      }
    }
  }

  // 2. Company intelligence
  if (input.companyId) {
    const profile =
      await companyIntelligenceRepository.selectCompanyProfileById(
        input.companyId,
        input.tenantId,
      );
    if (profile) {
      companyName = profile.name;
      sections.push({
        title: "Company Intelligence",
        content: buildCompanySection(profile),
        dataSource: "company-intelligence",
        confidence: 90,
      });
    }
  }

  // 3. Contact intelligence
  if (input.prospectId) {
    const contacts =
      await contactIntelligenceRepository.selectContactsByTenantId(
        input.tenantId,
        { prospectId: input.prospectId },
      );
    if (contacts.length > 0) {
      sections.push({
        title: "Key Contacts",
        content: contacts
          .slice(0, 10)
          .map(
            (c) =>
              `- **${c.firstName} ${c.lastName}** - ${c.title || "Unknown Title"} (${c.role}, confidence: ${c.confidenceScore}%)`,
          )
          .join("\n"),
        dataSource: "contact-intelligence",
        confidence: 75,
      });
    }
  }

  // 4. Add recommended actions section
  sections.push({
    title: "Recommended Next Steps",
    content: generateRecommendations(input.briefType, sections),
    dataSource: "ai-analysis",
    confidence: 70,
  });

  const title = `${input.briefType === "pre-meeting" ? "Pre-Meeting Brief" : "Sales Brief"}: ${companyName}`;
  const content = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  return { title, sections, content };
}

function buildProspectOverview(prospect: any): string {
  const lines: string[] = [];
  lines.push(`**Company:** ${prospect.companyName}`);
  if (prospect.website) lines.push(`**Website:** ${prospect.website}`);
  if (prospect.industry)
    lines.push(
      `**Industry:** ${prospect.industry}${prospect.subIndustry ? ` > ${prospect.subIndustry}` : ""}`,
    );
  if (prospect.employeeCount)
    lines.push(`**Employees:** ${prospect.employeeCount.toLocaleString()}`);
  if (prospect.annualRevenue)
    lines.push(
      `**Revenue:** $${Number(prospect.annualRevenue).toLocaleString()}`,
    );
  lines.push(`**Status:** ${prospect.status}`);
  if (prospect.fitScore) lines.push(`**Fit Score:** ${prospect.fitScore}/100`);
  if (prospect.intentScore)
    lines.push(`**Intent Score:** ${prospect.intentScore}/100`);
  if (prospect.location) {
    const loc = prospect.location as Record<string, unknown>;
    const locationParts = [loc.city, loc.state, loc.country].filter(Boolean);
    if (locationParts.length)
      lines.push(`**Location:** ${locationParts.join(", ")}`);
  }
  return lines.join("\n");
}

function buildCompanySection(profile: any): string {
  const lines: string[] = [];
  if (profile.description) lines.push(profile.description);
  if (profile.valueProposition)
    lines.push(`\n**Value Proposition:** ${profile.valueProposition}`);
  if (profile.targetMarkets?.length)
    lines.push(`**Target Markets:** ${profile.targetMarkets.join(", ")}`);
  if (profile.competitors?.length)
    lines.push(`**Key Competitors:** ${profile.competitors.join(", ")}`);
  if (profile.keyDifferentiators?.length)
    lines.push(`**Differentiators:** ${profile.keyDifferentiators.join(", ")}`);
  return lines.join("\n") || "No company intelligence available.";
}

function generateRecommendations(
  briefType: string,
  sections: Array<{ title: string; content: string }>,
): string {
  const recs: string[] = [];
  const hasContacts = sections.some((s) => s.title === "Key Contacts");
  const hasSignals = sections.some((s) => s.title.includes("Signals"));

  if (!hasContacts)
    recs.push(
      "1. **Identify key contacts** - No contacts found. Research decision-makers and champions.",
    );
  if (!hasSignals)
    recs.push(
      "2. **Monitor for buying signals** - Set up alert rules to detect compliance changes and expansion indicators.",
    );

  if (briefType === "pre-meeting") {
    recs.push(
      "3. **Prepare discovery questions** focused on current compliance challenges and automation needs.",
    );
    recs.push(
      "4. **Review recent regulatory changes** in their industry and region.",
    );
  } else {
    recs.push("3. **Calculate compliance burden** to quantify potential ROI.");
    recs.push(
      "4. **Generate personalized outreach** leveraging regulatory context.",
    );
  }
  return recs.join("\n") || "Continue monitoring and enriching prospect data.";
}
