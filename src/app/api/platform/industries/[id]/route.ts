import { NextResponse } from "next/server";
import { industryRepository } from "lib/db/repository";
import { IndustryCreateSchema } from "app-types/industry";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const industry = await industryRepository.selectIndustryById(id);

    if (!industry) {
      return NextResponse.json(
        { error: "Industry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(industry);
  } catch (error) {
    console.error("Failed to fetch industry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = IndustryCreateSchema.partial().parse(body);

    const industry = await industryRepository.updateIndustry(id, data);

    return NextResponse.json(industry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to update industry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await industryRepository.deleteIndustry(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete industry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
