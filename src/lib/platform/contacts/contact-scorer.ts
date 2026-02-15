import { contactIntelligenceRepository } from "lib/db/repository";
import type { Contact } from "app-types/contact-intelligence";

export type ContactScoreBreakdown = {
  dataQuality: number;
  roleFit: number;
  engagement: number;
  enrichmentDepth: number;
  total: number;
};

export function scoreContactData(contact: Contact): number {
  let score = 0;
  if (contact.email) score += 10;
  if (contact.emailVerified) score += 10;
  if (contact.phone) score += 5;
  if (contact.title) score += 5;
  if (contact.linkedinUrl) score += 5;
  if (contact.department) score += 3;
  if (contact.company) score += 3;
  return Math.min(25, score);
}

export function scoreContactRole(contact: Contact): number {
  const roleScores: Record<string, number> = {
    "decision-maker": 25,
    "economic-buyer": 22,
    "executive-sponsor": 22,
    champion: 20,
    influencer: 15,
    "technical-evaluator": 12,
    gatekeeper: 8,
    "end-user": 5,
    unknown: 3,
  };
  return roleScores[contact.role] ?? 3;
}

export async function calculateContactScore(
  contactId: string,
  tenantId: string,
): Promise<ContactScoreBreakdown> {
  const contact = await contactIntelligenceRepository.selectContactById(
    contactId,
    tenantId,
  );
  if (!contact) throw new Error("Contact not found");

  const activities =
    await contactIntelligenceRepository.selectActivitiesByContactId(
      contactId,
      tenantId,
      { limit: 20 },
    );
  const enrichments =
    await contactIntelligenceRepository.selectEnrichmentsByContactId(
      contactId,
      tenantId,
    );

  const dataQuality = scoreContactData(contact);
  const roleFit = scoreContactRole(contact);

  const recentActivities = activities.filter((a) => {
    const age = Date.now() - new Date(a.createdAt).getTime();
    return age < 30 * 24 * 60 * 60 * 1000;
  });
  const engagement = Math.min(25, recentActivities.length * 5);

  const completedEnrichments = enrichments.filter(
    (e) => e.status === "completed",
  );
  const enrichmentDepth = Math.min(25, completedEnrichments.length * 8);

  const total = Math.min(
    100,
    dataQuality + roleFit + engagement + enrichmentDepth,
  );

  return { dataQuality, roleFit, engagement, enrichmentDepth, total };
}
