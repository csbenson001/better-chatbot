import { contactIntelligenceRepository } from "lib/db/repository";

export interface RelationshipAnalysis {
  companyName: string;
  contacts: Array<{
    contactId: string;
    name: string;
    title: string;
    role: string;
    suggestedCommitteeRole: string;
    influence: number;
    engagementLevel: string;
  }>;
  relationships: Array<{
    fromContactId: string;
    toContactId: string;
    type: string;
    strength: number;
  }>;
  coverageGaps: string[];
  recommendations: string[];
}

// Analyze contacts and infer buying committee structure
export async function analyzeRelationships(
  tenantId: string,
  prospectId: string,
): Promise<RelationshipAnalysis> {
  const contacts = await contactIntelligenceRepository.selectContactsByTenantId(
    tenantId,
    { prospectId },
  );

  const analyzedContacts = contacts.map((c) => ({
    contactId: c.id,
    name: `${c.firstName} ${c.lastName}`,
    title: c.title || "Unknown",
    role: c.role,
    suggestedCommitteeRole: inferCommitteeRole(
      c.title || "",
      c.role,
      c.seniority || "",
    ),
    influence: estimateInfluence(c.title || "", c.seniority || "", c.role),
    engagementLevel:
      c.status === "engaged"
        ? "engaged"
        : c.status === "enriched"
          ? "aware"
          : "unknown",
  }));

  // Infer relationships based on titles and departments
  const relationships = inferRelationships(analyzedContacts);

  // Identify coverage gaps
  const coverageGaps = identifyCoverageGaps(analyzedContacts);

  // Generate recommendations
  const recommendations = generateRelationshipRecs(
    analyzedContacts,
    coverageGaps,
  );

  return {
    companyName: contacts[0]?.company || "Unknown Company",
    contacts: analyzedContacts,
    relationships,
    coverageGaps,
    recommendations,
  };
}

function inferCommitteeRole(
  title: string,
  currentRole: string,
  _seniority: string,
): string {
  const t = title.toLowerCase();

  if (t.includes("ceo") || t.includes("president") || t.includes("owner"))
    return "economic-buyer";
  if (t.includes("cfo") || t.includes("finance")) return "economic-buyer";
  if (t.includes("cto") || t.includes("cio") || t.includes("technology"))
    return "technical-evaluator";
  if (t.includes("vp") || t.includes("vice president")) return "decision-maker";
  if (t.includes("director")) return "influencer";
  if (
    t.includes("manager") &&
    (t.includes("compliance") || t.includes("environment"))
  )
    return "champion";
  if (t.includes("engineer") || t.includes("specialist")) return "end-user";
  if (t.includes("procurement") || t.includes("purchasing"))
    return "gatekeeper";
  if (t.includes("assistant") || t.includes("coordinator")) return "gatekeeper";

  if (currentRole !== "unknown") return currentRole;
  return "influencer";
}

function estimateInfluence(
  title: string,
  seniority: string,
  _role: string,
): number {
  const t = title.toLowerCase();

  if (t.includes("ceo") || t.includes("president") || t.includes("owner"))
    return 10;
  if (t.includes("cfo") || t.includes("coo") || t.includes("cto")) return 9;
  if (t.includes("vp") || t.includes("vice president")) return 8;
  if (t.includes("director")) return 7;
  if (t.includes("senior manager")) return 6;
  if (t.includes("manager")) return 5;
  if (t.includes("lead") || t.includes("senior")) return 4;
  if (t.includes("specialist") || t.includes("analyst")) return 3;

  if (seniority === "c-level") return 9;
  if (seniority === "vp") return 8;
  if (seniority === "director") return 7;

  return 3;
}

function inferRelationships(
  contacts: Array<{
    contactId: string;
    title: string;
    suggestedCommitteeRole: string;
    influence: number;
  }>,
): Array<{
  fromContactId: string;
  toContactId: string;
  type: string;
  strength: number;
}> {
  const relationships: Array<{
    fromContactId: string;
    toContactId: string;
    type: string;
    strength: number;
  }> = [];

  // Sort by influence to establish hierarchy
  const sorted = [...contacts].sort((a, b) => b.influence - a.influence);

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const higher = sorted[i];
      const lower = sorted[j];

      if (higher.influence - lower.influence >= 2) {
        relationships.push({
          fromContactId: lower.contactId,
          toContactId: higher.contactId,
          type: "reports-to",
          strength: Math.min(10, higher.influence),
        });
      } else if (higher.influence === lower.influence) {
        relationships.push({
          fromContactId: higher.contactId,
          toContactId: lower.contactId,
          type: "peers-with",
          strength: 5,
        });
      }
    }
  }

  return relationships.slice(0, 20); // Limit to avoid excessive edges
}

function identifyCoverageGaps(
  contacts: Array<{ suggestedCommitteeRole: string }>,
): string[] {
  const gaps: string[] = [];
  const roles = new Set(contacts.map((c) => c.suggestedCommitteeRole));

  if (!roles.has("economic-buyer"))
    gaps.push(
      "No Economic Buyer identified - need C-level or VP Finance contact",
    );
  if (!roles.has("champion"))
    gaps.push(
      "No Champion identified - need someone who will advocate internally",
    );
  if (!roles.has("technical-evaluator"))
    gaps.push("No Technical Evaluator - need technical decision-maker");
  if (!roles.has("end-user"))
    gaps.push(
      "No End Users identified - need people who will use the solution daily",
    );

  if (contacts.length < 3)
    gaps.push(
      "Too few contacts - aim for 3-5 contacts across the buying committee",
    );

  return gaps;
}

function generateRelationshipRecs(
  contacts: Array<{
    name: string;
    suggestedCommitteeRole: string;
    influence: number;
    engagementLevel: string;
  }>,
  gaps: string[],
): string[] {
  const recs: string[] = [];

  // Recommend engaging high-influence contacts first
  const disengaged = contacts
    .filter((c) => c.engagementLevel === "unknown" && c.influence >= 7)
    .sort((a, b) => b.influence - a.influence);

  for (const c of disengaged.slice(0, 3)) {
    recs.push(
      `Prioritize engaging ${c.name} (${c.suggestedCommitteeRole}, influence: ${c.influence}/10)`,
    );
  }

  if (gaps.length > 0) {
    recs.push(`Address ${gaps.length} coverage gap(s) in buying committee`);
  }

  if (
    contacts.length > 0 &&
    !contacts.some((c) => c.suggestedCommitteeRole === "champion")
  ) {
    recs.push(
      "Identify and develop a champion who understands the value proposition",
    );
  }

  return recs;
}
