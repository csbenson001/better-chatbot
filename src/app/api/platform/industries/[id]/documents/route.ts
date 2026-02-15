import { NextResponse } from "next/server";
import { industryRepository } from "lib/db/repository";
import { IndustryDocCreateSchema } from "app-types/industry";
import type { IndustryDocType } from "app-types/industry";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const options: {
      docType?: IndustryDocType;
      tenantId?: string;
      limit?: number;
      offset?: number;
    } = {};

    const docType = searchParams.get("docType");
    if (docType) {
      options.docType = docType as IndustryDocType;
    }

    const tenantId = searchParams.get("tenantId");
    if (tenantId) {
      options.tenantId = tenantId;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get("offset");
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    const documents = await industryRepository.selectDocumentsByIndustryId(
      id,
      options,
    );

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch industry documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = IndustryDocCreateSchema.parse({
      ...body,
      industryId: id,
    });

    const document = await industryRepository.insertIndustryDocument(data);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create industry document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
