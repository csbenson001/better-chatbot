import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";
import { TrialStatusSchema } from "app-types/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const trial = await rbacRepository.selectTrialByTenantId(tenantId);
    if (!trial || trial.id !== id) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }
    return NextResponse.json({ data: trial });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch trial" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: string };

    const parsed = TrialStatusSchema.parse(status);
    const trial = await rbacRepository.updateTrialStatus(id, parsed);
    return NextResponse.json({ data: trial });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid trial status" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update trial" },
      { status: 500 },
    );
  }
}
