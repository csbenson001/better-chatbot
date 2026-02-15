import { NextResponse } from "next/server";
import { rbacRepository } from "lib/db/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const users = await rbacRepository.selectUsersByRoleId(id, tenantId);
    return NextResponse.json({ data: users });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch users for role" },
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
    const { userId, assignedBy } = body as {
      userId: string;
      assignedBy?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Verify role belongs to tenant
    const role = await rbacRepository.selectRoleById(id, tenantId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const userRole = await rbacRepository.insertUserRole(
      userId,
      id,
      tenantId,
      assignedBy,
    );
    return NextResponse.json({ data: userRole }, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to assign user to role" },
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    await rbacRepository.deleteUserRole(userId, id, tenantId);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to remove user from role" },
      { status: 500 },
    );
  }
}
