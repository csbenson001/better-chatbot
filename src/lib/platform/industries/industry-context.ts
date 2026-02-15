import { industryRepository } from "lib/db/repository";
import type { Industry } from "app-types/industry";

/**
 * Build a rich prompt context string from an industry's data and documents.
 * Returns null if the industry is not found.
 */
export async function buildIndustryPromptContext(
  industryId: string,
): Promise<string | null> {
  const industry = await industryRepository.selectIndustryById(industryId);
  if (!industry) return null;

  const documents = await industryRepository.selectDocumentsByIndustryId(
    industryId,
    { limit: 50 },
  );

  const lines: string[] = [];

  // ─── Header ──────────────────────────────────────────────────────────────────
  lines.push(`## Industry: ${industry.name}`);

  if (industry.description) {
    lines.push(`\nDescription: ${industry.description}`);
  }

  // ─── Classification Codes ────────────────────────────────────────────────────
  if (industry.naicsCodes.length > 0) {
    lines.push(`\nNAICS Codes: ${industry.naicsCodes.join(", ")}`);
  }
  if (industry.sicCodes.length > 0) {
    lines.push(`SIC Codes: ${industry.sicCodes.join(", ")}`);
  }

  // ─── Value Chain ─────────────────────────────────────────────────────────────
  if (industry.valueChainTemplate.length > 0) {
    lines.push("\n### Value Chain Stages");
    for (const stage of industry.valueChainTemplate) {
      const stageName = (stage as Record<string, unknown>).name as string;
      const stageDesc = (stage as Record<string, unknown>).description as
        | string
        | undefined;
      const typicalPlayers = (stage as Record<string, unknown>)
        .typicalPlayers as string[] | undefined;

      lines.push(`\n**${stageName}**`);
      if (stageDesc) {
        lines.push(stageDesc);
      }
      if (typicalPlayers && typicalPlayers.length > 0) {
        lines.push(`Typical Players: ${typicalPlayers.join(", ")}`);
      }
    }
  }

  // ─── Regulatory Bodies ───────────────────────────────────────────────────────
  if (industry.regulatoryBodies.length > 0) {
    lines.push(
      `\n### Regulatory Bodies\n${industry.regulatoryBodies.join(", ")}`,
    );
  }

  // ─── Data Sources ────────────────────────────────────────────────────────────
  if (industry.dataSources.length > 0) {
    lines.push("\n### Data Sources");
    for (const source of industry.dataSources) {
      const src = source as Record<string, unknown>;
      const name = src.name as string;
      const url = src.url as string | undefined;
      const type = src.type as string | undefined;
      const desc = src.description as string | undefined;

      let line = `- **${name}**`;
      if (type) line += ` (${type})`;
      if (desc) line += `: ${desc}`;
      if (url) line += ` — ${url}`;
      lines.push(line);
    }
  }

  // ─── Keywords ────────────────────────────────────────────────────────────────
  if (industry.keywords.length > 0) {
    lines.push(`\n### Keywords\n${industry.keywords.join(", ")}`);
  }

  // ─── Metadata ────────────────────────────────────────────────────────────────
  if (Object.keys(industry.metadata).length > 0) {
    lines.push("\n### Industry Metadata");
    for (const [key, value] of Object.entries(industry.metadata)) {
      if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        lines.push(`${key}: ${value}`);
      }
    }
  }

  // ─── Documents ───────────────────────────────────────────────────────────────
  if (documents.length > 0) {
    lines.push("\n### Industry Documents");
    for (const doc of documents) {
      lines.push(`\n#### ${doc.title} (${doc.docType})`);
      // Include a truncated preview of content to keep context size manageable
      const contentPreview =
        doc.content.length > 1000
          ? doc.content.slice(0, 1000) + "..."
          : doc.content;
      lines.push(contentPreview);
      if (doc.tags.length > 0) {
        lines.push(`Tags: ${doc.tags.join(", ")}`);
      }
    }
  }

  return lines.filter(Boolean).join("\n");
}

/**
 * Try to match a company's industry/subIndustry strings to an Industry record
 * in the database using keyword matching.
 * Returns the best match or null if no match is found.
 */
export async function getIndustryForCompany(
  industry: string | null,
  subIndustry: string | null,
): Promise<Industry | null> {
  if (!industry && !subIndustry) return null;

  const allIndustries = await industryRepository.selectAllIndustries();
  if (allIndustries.length === 0) return null;

  const searchTerms = [industry, subIndustry]
    .filter((s): s is string => s !== null)
    .map((s) => s.toLowerCase());

  let bestMatch: Industry | null = null;
  let bestScore = 0;

  for (const ind of allIndustries) {
    let score = 0;

    // Check name match
    const nameLower = ind.name.toLowerCase();
    for (const term of searchTerms) {
      if (nameLower.includes(term) || term.includes(nameLower)) {
        score += 10;
      }
    }

    // Check slug match
    const slugLower = ind.slug.toLowerCase();
    for (const term of searchTerms) {
      const termSlug = term.replace(/\s+/g, "-").replace(/&/g, "and");
      if (slugLower.includes(termSlug) || termSlug.includes(slugLower)) {
        score += 8;
      }
    }

    // Check keyword matches
    for (const keyword of ind.keywords) {
      const keywordLower = keyword.toLowerCase();
      for (const term of searchTerms) {
        if (keywordLower.includes(term) || term.includes(keywordLower)) {
          score += 3;
        }
        // Partial word matching for multi-word terms
        const termWords = term.split(/\s+/);
        for (const word of termWords) {
          if (word.length > 3 && keywordLower.includes(word)) {
            score += 1;
          }
        }
      }
    }

    // Check NAICS/SIC code matches (exact)
    for (const term of searchTerms) {
      if (ind.naicsCodes.includes(term)) {
        score += 15;
      }
      if (ind.sicCodes.includes(term)) {
        score += 15;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = ind;
    }
  }

  // Only return a match if we have a minimum confidence threshold
  return bestScore >= 3 ? bestMatch : null;
}
