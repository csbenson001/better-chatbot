import { prospectingRepository } from "lib/db/repository";
import { contactIntelligenceRepository } from "lib/db/repository";

export async function extractContactsFromFilings(
  tenantId: string,
  options?: { sourceId?: string; limit?: number },
): Promise<{
  contactsCreated: number;
  contactsUpdated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let contactsCreated = 0;
  let contactsUpdated = 0;

  const filings = await prospectingRepository.selectFilingRecordsByTenantId(
    tenantId,
    {
      sourceId: options?.sourceId,
      limit: options?.limit ?? 100,
    },
  );

  for (const filing of filings) {
    try {
      if (!filing.contactName && !filing.contactEmail) continue;

      const nameParts = (filing.contactName || "Unknown").split(/\s+/);
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Unknown";

      if (filing.contactEmail) {
        const existing =
          await contactIntelligenceRepository.selectContactByEmail(
            filing.contactEmail,
            tenantId,
          );

        if (existing) {
          await contactIntelligenceRepository.updateContact(
            existing.id,
            tenantId,
            {
              metadata: {
                ...existing.metadata,
                filingRecords: [
                  ...((existing.metadata.filingRecords as string[]) || []),
                  filing.id,
                ],
                lastFilingDate: filing.filingDate,
              },
            },
          );
          contactsUpdated++;
          continue;
        }
      }

      const isDecisionMaker =
        filing.contactTitle?.toLowerCase().includes("director") ||
        filing.contactTitle?.toLowerCase().includes("vp") ||
        filing.contactTitle?.toLowerCase().includes("manager");

      await contactIntelligenceRepository.insertContact({
        tenantId,
        prospectId: filing.prospectId || undefined,
        firstName,
        lastName,
        email: filing.contactEmail || undefined,
        phone: filing.contactPhone || undefined,
        title: filing.contactTitle || undefined,
        company: filing.companyName || filing.facilityName || undefined,
        role: isDecisionMaker ? "decision-maker" : "unknown",
        confidenceScore: filing.contactEmail ? 70 : 40,
        emailVerified: false,
        tags: ["filing-extracted"],
        metadata: {
          filingRecords: [filing.id],
          filingType: filing.filingType,
          facilityName: filing.facilityName,
          regulatoryProgram: filing.regulatoryProgram,
          extractedFrom: "filing-record",
        },
      });
      contactsCreated++;
    } catch (err) {
      errors.push(
        `Filing ${filing.id}: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  }

  return { contactsCreated, contactsUpdated, errors };
}
