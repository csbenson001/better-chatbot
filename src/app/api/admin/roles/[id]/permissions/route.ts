import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const permissions = await rbacRepository.selectPermissionsByRoleId(id);
    return NextResponse.json({ data: permissions });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
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

    // Verify role belongs to tenant
    const role = await rbacRepository.selectRoleById(id, tenantId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await request.json();
    const { permissionIds } = body as { permissionIds: string[] };

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "permissionIds must be an array" },
        { status: 400 },
      );
    }

    // Validate permission IDs exist
    if (permissionIds.length > 0) {
      const existing =
        await rbacRepository.selectPermissionsByIds(permissionIds);
      if (existing.length !== permissionIds.length) {
        return NextResponse.json(
          { error: "One or more permission IDs are invalid" },
          { status: 400 },
        );
      }
    }

    // Replace all permissions: delete existing, insert new
    await rbacRepository.deleteRolePermissions(id);
    for (const permId of permissionIds) {
      await rbacRepository.insertRolePermission(id, permId);
    }

    const updatedPermissions =
      await rbacRepository.selectPermissionsByRoleId(id);
    return NextResponse.json({ data: updatedPermissions });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 },
    );
  }
}
