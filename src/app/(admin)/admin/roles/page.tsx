"use client";

import { useState, useEffect, useCallback } from "react";

type Permission = {
  id: string;
  resource: string;
  action: string;
  description: string;
};

type Role = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
};

type RoleUser = {
  userId: string;
  assignedAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  "super-admin": "bg-red-500/15 text-red-400",
  "tenant-admin": "bg-orange-500/15 text-orange-400",
  manager: "bg-blue-500/15 text-blue-400",
  user: "bg-green-500/15 text-green-400",
  viewer: "bg-zinc-500/15 text-zinc-400",
  custom: "bg-purple-500/15 text-purple-400",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("user");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/roles");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRoles(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSelectRole = async (role: Role) => {
    try {
      const [roleRes, usersRes] = await Promise.all([
        fetch(`/api/admin/roles/${role.id}`),
        fetch(`/api/admin/roles/${role.id}/users`),
      ]);
      const roleJson = await roleRes.json();
      const usersJson = await usersRes.json();

      setSelectedRole(roleJson.data);
      setRoleUsers(usersJson.data ?? []);
    } catch {
      setError("Failed to load role details");
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          description: newDescription || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShowCreateModal(false);
      setNewName("");
      setNewType("user");
      setNewDescription("");
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete role");
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Roles</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage roles and permissions for your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-500 transition-colors"
        >
          Add Role
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Table */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className={`hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                      selectedRole?.id === role.id ? "bg-zinc-800/50" : ""
                    }`}
                    onClick={() => handleSelectRole(role)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {role.name}
                        </span>
                        {role.isDefault && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-700 text-zinc-300 rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          TYPE_COLORS[role.type] ?? TYPE_COLORS.custom
                        }`}
                      >
                        {role.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">
                      {role.description ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      No roles found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Details Panel */}
        <div className="lg:col-span-1">
          {selectedRole ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                {selectedRole.name}
              </h3>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  TYPE_COLORS[selectedRole.type] ?? TYPE_COLORS.custom
                }`}
              >
                {selectedRole.type}
              </span>
              {selectedRole.description && (
                <p className="mt-3 text-sm text-zinc-400">
                  {selectedRole.description}
                </p>
              )}

              <div className="mt-5">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Permissions ({selectedRole.permissions?.length ?? 0})
                </h4>
                {selectedRole.permissions &&
                selectedRole.permissions.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {selectedRole.permissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span className="text-zinc-300">
                          {perm.resource}.{perm.action}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No permissions assigned
                  </p>
                )}
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Users ({roleUsers.length})
                </h4>
                {roleUsers.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {roleUsers.map((u) => (
                      <div
                        key={u.userId}
                        className="text-xs text-zinc-400 py-1 flex justify-between"
                      >
                        <span className="font-mono truncate">
                          {u.userId.slice(0, 8)}...
                        </span>
                        <span className="text-zinc-600">
                          {new Date(u.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No users assigned</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-sm text-zinc-500">
                Select a role to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Create Role
            </h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tenant-admin">Tenant Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Describe this role..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
