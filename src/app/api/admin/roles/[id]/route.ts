import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";
import { RoleUpdateSchema } from "app-types/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const role = await rbacRepository.selectRoleById(id, tenantId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    const permissions = await rbacRepository.selectPermissionsByRoleId(id);
    return NextResponse.json({ data: { ...role, permissions } });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch role" },
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
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = RoleUpdateSchema.parse(body);
    const role = await rbacRepository.updateRole(id, tenantId, data);
    return NextResponse.json({ data: role });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid role data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    await rbacRepository.deleteRole(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
