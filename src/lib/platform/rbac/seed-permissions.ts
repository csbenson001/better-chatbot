import type { PermissionResource, PermissionAction } from "app-types/rbac";

export const DEFAULT_PERMISSIONS: {
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
}[] = [
  // Users
  { resource: "users", action: "read", description: "View user profiles" },
  { resource: "users", action: "create", description: "Create new users" },
  { resource: "users", action: "update", description: "Update user profiles" },
  { resource: "users", action: "delete", description: "Delete users" },
  { resource: "users", action: "manage", description: "Full user management" },
  // Roles
  { resource: "roles", action: "read", description: "View roles" },
  { resource: "roles", action: "manage", description: "Full role management" },
  // Tenants
  { resource: "tenants", action: "read", description: "View tenant info" },
  {
    resource: "tenants",
    action: "manage",
    description: "Full tenant management",
  },
  // Connectors
  { resource: "connectors", action: "read", description: "View connectors" },
  {
    resource: "connectors",
    action: "create",
    description: "Create connectors",
  },
  {
    resource: "connectors",
    action: "execute",
    description: "Run connector syncs",
  },
  {
    resource: "connectors",
    action: "manage",
    description: "Full connector management",
  },
  // Agents
  {
    resource: "agents",
    action: "read",
    description: "View agent configurations",
  },
  { resource: "agents", action: "execute", description: "Execute agents" },
  {
    resource: "agents",
    action: "manage",
    description: "Full agent management",
  },
  // Leads
  { resource: "leads", action: "read", description: "View leads" },
  { resource: "leads", action: "create", description: "Create leads" },
  { resource: "leads", action: "update", description: "Update leads" },
  { resource: "leads", action: "manage", description: "Full lead management" },
  // Prospects
  { resource: "prospects", action: "read", description: "View prospects" },
  {
    resource: "prospects",
    action: "create",
    description: "Create prospects",
  },
  {
    resource: "prospects",
    action: "manage",
    description: "Full prospect management",
  },
  // Contacts
  { resource: "contacts", action: "read", description: "View contacts" },
  { resource: "contacts", action: "create", description: "Create contacts" },
  {
    resource: "contacts",
    action: "manage",
    description: "Full contact management",
  },
  // Knowledge
  {
    resource: "knowledge",
    action: "read",
    description: "View knowledge base",
  },
  {
    resource: "knowledge",
    action: "create",
    description: "Add knowledge documents",
  },
  {
    resource: "knowledge",
    action: "manage",
    description: "Full knowledge management",
  },
  // Company Profiles
  {
    resource: "company-profiles",
    action: "read",
    description: "View company profiles",
  },
  {
    resource: "company-profiles",
    action: "manage",
    description: "Full company profile management",
  },
  // Industries
  { resource: "industries", action: "read", description: "View industries" },
  {
    resource: "industries",
    action: "manage",
    description: "Full industry management",
  },
  // Billing
  { resource: "billing", action: "read", description: "View billing info" },
  {
    resource: "billing",
    action: "manage",
    description: "Full billing management",
  },
  // Subscriptions
  {
    resource: "subscriptions",
    action: "read",
    description: "View subscriptions",
  },
  {
    resource: "subscriptions",
    action: "manage",
    description: "Manage subscriptions",
  },
  // Analytics
  { resource: "analytics", action: "read", description: "View analytics" },
  // Admin
  { resource: "admin", action: "read", description: "View admin panel" },
  { resource: "admin", action: "manage", description: "Full admin access" },
  // Settings
  { resource: "settings", action: "read", description: "View settings" },
  { resource: "settings", action: "manage", description: "Manage settings" },
  // API Keys
  { resource: "api-keys", action: "read", description: "View API keys" },
  { resource: "api-keys", action: "create", description: "Create API keys" },
  {
    resource: "api-keys",
    action: "manage",
    description: "Full API key management",
  },
];

export const DEFAULT_ROLES: {
  name: string;
  type: "tenant-admin" | "manager" | "user" | "viewer";
  description: string;
  permissionPatterns: string[];
}[] = [
  {
    name: "Admin",
    type: "tenant-admin",
    description: "Full tenant administration",
    permissionPatterns: ["*.manage"],
  },
  {
    name: "Manager",
    type: "manager",
    description: "Manages leads, prospects, and team",
    permissionPatterns: [
      "users.read",
      "users.update",
      "leads.manage",
      "prospects.manage",
      "contacts.manage",
      "knowledge.manage",
      "connectors.read",
      "agents.execute",
      "analytics.read",
      "company-profiles.read",
    ],
  },
  {
    name: "Sales Rep",
    type: "user",
    description: "Standard sales user",
    permissionPatterns: [
      "leads.read",
      "leads.create",
      "leads.update",
      "prospects.read",
      "contacts.read",
      "contacts.create",
      "knowledge.read",
      "agents.execute",
      "analytics.read",
    ],
  },
  {
    name: "Viewer",
    type: "viewer",
    description: "Read-only access",
    permissionPatterns: [
      "leads.read",
      "prospects.read",
      "contacts.read",
      "knowledge.read",
      "analytics.read",
    ],
  },
];
