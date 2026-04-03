import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";
import { TrialCreateSchema } from "app-types/rbac";
import { hasAdminPermission } from "lib/auth/permissions";

export async function GET(_request: Request) {
  if (!(await hasAdminPermission())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const trials = await rbacRepository.selectAllTrials();
    return NextResponse.json({ data: trials });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch trials" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminPermission())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const data = TrialCreateSchema.parse(body);
    const trial = await rbacRepository.insertTrial(data);
    return NextResponse.json({ data: trial }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid trial data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create trial" },
      { status: 500 },
    );
  }
}
