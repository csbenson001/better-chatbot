import { NextResponse } from "next/server";
import { industryRepository } from "lib/db/repository";
import { IndustryCreateSchema } from "app-types/industry";
import { z } from "zod";

export async function GET() {
  try {
    const industries = await industryRepository.selectAllIndustries();

    return NextResponse.json(industries);
  } catch (error) {
    console.error("Failed to fetch industries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = IndustryCreateSchema.parse(body);

    const industry = await industryRepository.insertIndustry(data);

    return NextResponse.json(industry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create industry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
