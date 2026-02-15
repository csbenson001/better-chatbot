import { NextResponse } from "next/server";
import { industryRepository } from "lib/db/repository";
import { IndustryCreateSchema } from "app-types/industry";
import { SEED_INDUSTRIES } from "lib/platform/industries/seed-industries";

export async function POST() {
  try {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const seed of SEED_INDUSTRIES) {
      const existing = await industryRepository.selectIndustryBySlug(seed.slug);

      if (existing) {
        skipped.push(seed.name);
        continue;
      }

      const data = IndustryCreateSchema.parse({
        name: seed.name,
        slug: seed.slug,
        parentId: seed.parentId ?? undefined,
        description: seed.description ?? undefined,
        naicsCodes: seed.naicsCodes,
        sicCodes: seed.sicCodes,
        keywords: seed.keywords,
        valueChainTemplate: seed.valueChainTemplate,
        regulatoryBodies: seed.regulatoryBodies,
        dataSources: seed.dataSources,
        metadata: seed.metadata ?? {},
      });

      const industry = await industryRepository.insertIndustry(data);

      created.push(industry.name);
    }

    return NextResponse.json(
      {
        message: `Seeded ${created.length} industries, skipped ${skipped.length} duplicates`,
        created: created.length,
        skipped: skipped.length,
        createdNames: created,
        skippedNames: skipped,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to seed industries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
