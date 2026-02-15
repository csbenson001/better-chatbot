import { companyIntelligenceRepository } from "lib/db/repository";
import type { CompanyProfile } from "app-types/company-intelligence";

export type CompanyContext = {
  profile: CompanyProfile;
  products: Awaited<
    ReturnType<typeof companyIntelligenceRepository.selectProductsByCompanyId>
  >;
  valueChain: Awaited<
    ReturnType<typeof companyIntelligenceRepository.selectValueChainByCompanyId>
  >;
  methodologies: Awaited<
    ReturnType<
      typeof companyIntelligenceRepository.selectSalesMethodologyByCompanyId
    >
  >;
};

export async function buildCompanyContext(
  companyId: string,
  tenantId: string,
): Promise<CompanyContext | null> {
  const profile = await companyIntelligenceRepository.selectCompanyProfileById(
    companyId,
    tenantId,
  );
  if (!profile) return null;

  const [products, valueChain, methodologies] = await Promise.all([
    companyIntelligenceRepository.selectProductsByCompanyId(
      companyId,
      tenantId,
    ),
    companyIntelligenceRepository.selectValueChainByCompanyId(
      companyId,
      tenantId,
    ),
    companyIntelligenceRepository.selectSalesMethodologyByCompanyId(
      companyId,
      tenantId,
    ),
  ]);

  return { profile, products, valueChain, methodologies };
}

export function buildCompanyPromptContext(context: CompanyContext): string {
  const { profile, products, valueChain, methodologies } = context;

  const lines: string[] = [
    `## Company: ${profile.name}`,
    profile.description ? `\nDescription: ${profile.description}` : "",
    profile.industry ? `Industry: ${profile.industry}` : "",
    profile.subIndustry ? `Sub-Industry: ${profile.subIndustry}` : "",
    profile.website ? `Website: ${profile.website}` : "",
    profile.employeeCount
      ? `Employees: ${profile.employeeCount.toLocaleString()}`
      : "",
    profile.annualRevenue
      ? `Annual Revenue: $${profile.annualRevenue.toLocaleString()}`
      : "",
    profile.valueProposition
      ? `\nValue Proposition: ${profile.valueProposition}`
      : "",
    profile.salesMethodology
      ? `\nSales Methodology: ${profile.salesMethodology}`
      : "",
  ];

  if (profile.targetMarkets.length > 0) {
    lines.push(`\nTarget Markets: ${profile.targetMarkets.join(", ")}`);
  }
  if (profile.keyDifferentiators.length > 0) {
    lines.push(`Key Differentiators: ${profile.keyDifferentiators.join(", ")}`);
  }
  if (profile.competitors.length > 0) {
    lines.push(`Key Competitors: ${profile.competitors.join(", ")}`);
  }

  if (products.length > 0) {
    lines.push("\n## Products & Services");
    for (const p of products) {
      lines.push(`\n### ${p.name} (${p.type})`);
      if (p.description) lines.push(p.description);
      if (p.features.length > 0)
        lines.push(`Features: ${p.features.join(", ")}`);
      if (p.benefits.length > 0)
        lines.push(`Benefits: ${p.benefits.join(", ")}`);
      if (p.useCases.length > 0)
        lines.push(`Use Cases: ${p.useCases.join(", ")}`);
      if (p.competitiveAdvantages.length > 0)
        lines.push(
          `Competitive Advantages: ${p.competitiveAdvantages.join(", ")}`,
        );
    }
  }

  if (valueChain.length > 0) {
    lines.push("\n## Value Chain");
    for (const vc of valueChain) {
      lines.push(`\n### ${vc.stage}: ${vc.name}`);
      if (vc.description) lines.push(vc.description);
      if (vc.activities.length > 0)
        lines.push(`Activities: ${vc.activities.join(", ")}`);
      if (vc.painPoints.length > 0)
        lines.push(`Pain Points: ${vc.painPoints.join(", ")}`);
      if (vc.opportunities.length > 0)
        lines.push(`Opportunities: ${vc.opportunities.join(", ")}`);
    }
  }

  if (methodologies.length > 0) {
    lines.push("\n## Sales Methodology");
    for (const m of methodologies) {
      lines.push(`\n### ${m.name}${m.framework ? ` (${m.framework})` : ""}`);
      const stages = m.stages as Array<{
        name?: string;
        description?: string;
      }>;
      if (stages.length > 0) {
        lines.push("Stages:");
        for (const s of stages) {
          lines.push(`  - ${s.name}: ${s.description || ""}`);
        }
      }
    }
  }

  return lines.filter(Boolean).join("\n");
}

export async function getClientCompanyContext(
  tenantId: string,
): Promise<CompanyContext | null> {
  const profiles =
    await companyIntelligenceRepository.selectCompanyProfilesByTenantId(
      tenantId,
      { isClientCompany: true, limit: 1 },
    );
  if (profiles.length === 0) return null;
  return buildCompanyContext(profiles[0].id, tenantId);
}
