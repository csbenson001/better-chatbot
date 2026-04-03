import "server-only";
import { createHash } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { SystemPromptTable, SystemPromptAuditTable } from "../schema.pg";

// In-process cache: name → { content, version, expiresAt }
const promptCache = new Map<
  string,
  { content: string; version: number; expiresAt: number }
>();
const CACHE_TTL_MS = 30_000;

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function invalidateCache(name: string) {
  promptCache.delete(name);
}

export type SystemPromptMeta = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SystemPromptAuditEntry = {
  id: string;
  systemPromptId: string;
  version: number;
  contentHash: string;
  changedBy: string;
  changedAt: Date;
  action: string;
};

export const pgSystemPromptRepository = {
  /**
   * Get the content of the active prompt for a given name.
   * Returns null if no active prompt exists — caller falls back to hardcoded prompt.
   * Caches result for 30 seconds.
   */
  async getActiveContent(
    name: string,
  ): Promise<{ content: string; version: number } | null> {
    const now = Date.now();
    const cached = promptCache.get(name);
    if (cached && cached.expiresAt > now) {
      return { content: cached.content, version: cached.version };
    }

    const [row] = await db
      .select({
        content: SystemPromptTable.content,
        version: SystemPromptTable.version,
      })
      .from(SystemPromptTable)
      .where(
        and(
          eq(SystemPromptTable.name, name),
          eq(SystemPromptTable.isActive, true),
        ),
      )
      .limit(1);

    if (row) {
      promptCache.set(name, {
        content: row.content,
        version: row.version,
        expiresAt: now + CACHE_TTL_MS,
      });
      return { content: row.content, version: row.version };
    }

    return null;
  },

  /**
   * List all prompts (metadata only — no content field).
   */
  async listMeta(): Promise<SystemPromptMeta[]> {
    return db
      .select({
        id: SystemPromptTable.id,
        name: SystemPromptTable.name,
        description: SystemPromptTable.description,
        version: SystemPromptTable.version,
        isActive: SystemPromptTable.isActive,
        createdBy: SystemPromptTable.createdBy,
        createdAt: SystemPromptTable.createdAt,
        updatedAt: SystemPromptTable.updatedAt,
      })
      .from(SystemPromptTable)
      .orderBy(SystemPromptTable.name, desc(SystemPromptTable.version));
  },

  /**
   * Get a single prompt's content by id — for the superadmin editor only.
   */
  async getById(
    id: string,
  ): Promise<(SystemPromptMeta & { content: string }) | null> {
    const [row] = await db
      .select()
      .from(SystemPromptTable)
      .where(eq(SystemPromptTable.id, id));
    return row ?? null;
  },

  /**
   * Get the latest version number for a given prompt name.
   */
  async getLatestVersion(name: string): Promise<number> {
    const [row] = await db
      .select({ version: SystemPromptTable.version })
      .from(SystemPromptTable)
      .where(eq(SystemPromptTable.name, name))
      .orderBy(desc(SystemPromptTable.version))
      .limit(1);
    return row?.version ?? 0;
  },

  /**
   * Create a new version of a prompt.
   * Always inserts a new row — never mutates existing rows.
   * Writes an audit entry.
   */
  async createVersion(params: {
    name: string;
    description?: string;
    content: string;
    createdBy: string;
  }): Promise<SystemPromptMeta> {
    const latestVersion = await pgSystemPromptRepository.getLatestVersion(
      params.name,
    );
    const nextVersion = latestVersion + 1;

    const [row] = await db
      .insert(SystemPromptTable)
      .values({
        name: params.name,
        description: params.description ?? null,
        content: params.content,
        version: nextVersion,
        isActive: false,
        createdBy: params.createdBy,
      })
      .returning({
        id: SystemPromptTable.id,
        name: SystemPromptTable.name,
        description: SystemPromptTable.description,
        version: SystemPromptTable.version,
        isActive: SystemPromptTable.isActive,
        createdBy: SystemPromptTable.createdBy,
        createdAt: SystemPromptTable.createdAt,
        updatedAt: SystemPromptTable.updatedAt,
      });

    await db.insert(SystemPromptAuditTable).values({
      systemPromptId: row.id,
      version: row.version,
      contentHash: hashContent(params.content),
      changedBy: params.createdBy,
      action: nextVersion === 1 ? "created" : "updated",
    });

    return row;
  },

  /**
   * Activate a specific prompt version.
   * Deactivates all other versions for the same name first.
   */
  async activateVersion(id: string, activatedBy: string): Promise<void> {
    const [target] = await db
      .select({
        name: SystemPromptTable.name,
        version: SystemPromptTable.version,
      })
      .from(SystemPromptTable)
      .where(eq(SystemPromptTable.id, id));

    if (!target) throw new Error(`System prompt not found: ${id}`);

    // Deactivate all versions for this name
    const deactivated = await db
      .update(SystemPromptTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(SystemPromptTable.name, target.name),
          eq(SystemPromptTable.isActive, true),
        ),
      )
      .returning({
        id: SystemPromptTable.id,
        version: SystemPromptTable.version,
      });

    // Write deactivation audit entries
    for (const row of deactivated) {
      await db.insert(SystemPromptAuditTable).values({
        systemPromptId: row.id,
        version: row.version,
        contentHash: "deactivated",
        changedBy: activatedBy,
        action: "deactivated",
      });
    }

    // Activate the target version
    await db
      .update(SystemPromptTable)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(SystemPromptTable.id, id));

    await db.insert(SystemPromptAuditTable).values({
      systemPromptId: id,
      version: target.version,
      contentHash: "activated",
      changedBy: activatedBy,
      action: "activated",
    });

    // Invalidate cache for this prompt name
    invalidateCache(target.name);
  },

  /**
   * Get audit log for a prompt name (metadata only — no content).
   */
  async getAuditLog(name: string): Promise<SystemPromptAuditEntry[]> {
    return db
      .select({
        id: SystemPromptAuditTable.id,
        systemPromptId: SystemPromptAuditTable.systemPromptId,
        version: SystemPromptAuditTable.version,
        contentHash: SystemPromptAuditTable.contentHash,
        changedBy: SystemPromptAuditTable.changedBy,
        changedAt: SystemPromptAuditTable.changedAt,
        action: SystemPromptAuditTable.action,
      })
      .from(SystemPromptAuditTable)
      .innerJoin(
        SystemPromptTable,
        eq(SystemPromptAuditTable.systemPromptId, SystemPromptTable.id),
      )
      .where(eq(SystemPromptTable.name, name))
      .orderBy(desc(SystemPromptAuditTable.changedAt));
  },
};
