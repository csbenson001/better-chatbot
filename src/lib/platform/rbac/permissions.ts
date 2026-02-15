import { rbacRepository } from "lib/db/repository";

export async function checkPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  const roles = await rbacRepository.selectRolesByUserId(userId, tenantId);

  for (const role of roles) {
    // Super-admin has all permissions
    if (role.type === "super-admin") return true;

    const perms = await rbacRepository.selectPermissionsByRoleId(role.id);
    if (
      perms.some(
        (p) =>
          p.resource === resource &&
          (p.action === action || p.action === "manage"),
      )
    ) {
      return true;
    }
  }

  return false;
}

export async function getUserPermissions(
  userId: string,
  tenantId: string,
): Promise<string[]> {
  const roles = await rbacRepository.selectRolesByUserId(userId, tenantId);
  const permSet = new Set<string>();

  for (const role of roles) {
    if (role.type === "super-admin") return ["*"];

    const perms = await rbacRepository.selectPermissionsByRoleId(role.id);
    for (const p of perms) {
      permSet.add(`${p.resource}.${p.action}`);
    }
  }

  return [...permSet];
}

export async function requirePermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string,
): Promise<void> {
  const allowed = await checkPermission(userId, tenantId, resource, action);
  if (!allowed) {
    throw new Error(`Permission denied: ${resource}.${action}`);
  }
}
