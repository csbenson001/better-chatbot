import { contactIntelligenceRepository } from "lib/db/repository";
import type {
  Contact,
  ContactSourceType,
} from "app-types/contact-intelligence";

export type EnrichmentProvider = {
  type: ContactSourceType;
  name: string;
  enrich: (contact: Contact) => Promise<{
    data: Record<string, unknown>;
    confidence: number;
  } | null>;
};

const providers: EnrichmentProvider[] = [];

export function registerEnrichmentProvider(provider: EnrichmentProvider): void {
  providers.push(provider);
}

export async function enrichContact(
  contactId: string,
  tenantId: string,
  sourceTypes?: ContactSourceType[],
): Promise<{ enrichments: number; errors: string[] }> {
  const contact = await contactIntelligenceRepository.selectContactById(
    contactId,
    tenantId,
  );
  if (!contact) throw new Error("Contact not found");

  const errors: string[] = [];
  let enrichments = 0;

  const activeProviders = sourceTypes
    ? providers.filter((p) => sourceTypes.includes(p.type))
    : providers;

  for (const provider of activeProviders) {
    try {
      const result = await provider.enrich(contact);
      if (result) {
        await contactIntelligenceRepository.insertContactEnrichment({
          contactId,
          tenantId,
          sourceType: provider.type,
          enrichedData: result.data,
          confidenceScore: result.confidence,
          metadata: { providerName: provider.name },
        });
        enrichments++;
      }
    } catch (err) {
      errors.push(
        `${provider.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  if (enrichments > 0) {
    await contactIntelligenceRepository.updateContact(contactId, tenantId, {
      enrichedAt: new Date(),
      status: "enriched",
    });
  }

  return { enrichments, errors };
}

export async function mergeEnrichments(
  contactId: string,
  tenantId: string,
): Promise<Record<string, unknown>> {
  const enrichments =
    await contactIntelligenceRepository.selectEnrichmentsByContactId(
      contactId,
      tenantId,
    );

  const sorted = [...enrichments]
    .filter((e) => e.status === "completed")
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  const merged: Record<string, unknown> = {};
  for (const e of sorted) {
    for (const [key, value] of Object.entries(e.enrichedData)) {
      if (!(key in merged) && value != null) {
        merged[key] = value;
      }
    }
  }

  return merged;
}
