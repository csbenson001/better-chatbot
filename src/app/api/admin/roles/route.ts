import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";
import { RoleCreateSchema } from "app-types/rbac";

export async function GET(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const roles = await rbacRepository.selectRolesByTenantId(tenantId);
    return NextResponse.json({ data: roles });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = RoleCreateSchema.parse({ ...body, tenantId });
    const role = await rbacRepository.insertRole(data);
    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid role data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}
