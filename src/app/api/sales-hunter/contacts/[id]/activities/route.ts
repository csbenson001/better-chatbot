import { NextResponse } from "next/server";
import { contactIntelligenceRepository } from "lib/db/repository";
import { ContactActivityCreateSchema } from "app-types/contact-intelligence";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const { searchParams } = new URL(request.url);
    const activities =
      await contactIntelligenceRepository.selectActivitiesByContactId(
        id,
        tenantId,
        {
          activityType: (searchParams.get("activityType") as any) || undefined,
          limit: searchParams.get("limit")
            ? Number(searchParams.get("limit"))
            : 50,
        },
      );
    return NextResponse.json({ data: activities });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch activities" },
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
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = ContactActivityCreateSchema.parse({
      ...body,
      contactId: id,
      tenantId,
    });
    const activity =
      await contactIntelligenceRepository.insertContactActivity(data);
    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid activity data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 },
    );
  }
}
