import { and, desc, eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import {
  BookmarkTable,
  AgentTable,
  ChatThreadTable,
  ProjectTable,
} from "../schema.pg";

type BookmarkItemType = "agent" | "workflow" | "mcp" | "thread" | "project";

export interface StarredThread {
  id: string;
  title: string | null;
  createdAt: Date;
}

export interface StarredProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkRepository {
  createBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
  ): Promise<void>;

  removeBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
  ): Promise<void>;

  toggleBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
    isCurrentlyBookmarked: boolean,
  ): Promise<boolean>;

  checkItemAccess(
    itemId: string,
    itemType: BookmarkItemType,
    userId: string,
  ): Promise<boolean>;

  selectStarredThreads(userId: string): Promise<StarredThread[]>;

  selectStarredProjects(userId: string): Promise<StarredProject[]>;
}

export const pgBookmarkRepository: BookmarkRepository = {
  async createBookmark(userId, itemId, itemType) {
    await db
      .insert(BookmarkTable)
      .values({
        userId,
        itemId,
        itemType,
      })
      .onConflictDoNothing();
  },

  async removeBookmark(userId, itemId, itemType) {
    await db
      .delete(BookmarkTable)
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemId, itemId),
          eq(BookmarkTable.itemType, itemType),
        ),
      );
  },

  async toggleBookmark(userId, itemId, itemType, isCurrentlyBookmarked) {
    if (isCurrentlyBookmarked) {
      await this.removeBookmark(userId, itemId, itemType);
      return false;
    } else {
      await this.createBookmark(userId, itemId, itemType);
      return true;
    }
  },

  async checkItemAccess(itemId, itemType, userId) {
    if (itemType === "agent") {
      const [agent] = await db
        .select()
        .from(AgentTable)
        .where(eq(AgentTable.id, itemId))
        .limit(1);
      if (!agent) return false;
      return (
        agent.visibility === "public" ||
        agent.visibility === "readonly" ||
        agent.userId === userId
      );
    }

    if (itemType === "thread") {
      const [thread] = await db
        .select({ userId: ChatThreadTable.userId })
        .from(ChatThreadTable)
        .where(eq(ChatThreadTable.id, itemId))
        .limit(1);
      if (!thread) return false;
      return thread.userId === userId;
    }

    if (itemType === "project") {
      const [project] = await db
        .select({ userId: ProjectTable.userId })
        .from(ProjectTable)
        .where(eq(ProjectTable.id, itemId))
        .limit(1);
      if (!project) return false;
      return project.userId === userId;
    }

    return false;
  },

  async selectStarredThreads(userId) {
    return db
      .select({
        id: ChatThreadTable.id,
        title: ChatThreadTable.title,
        createdAt: ChatThreadTable.createdAt,
      })
      .from(BookmarkTable)
      .innerJoin(ChatThreadTable, eq(BookmarkTable.itemId, ChatThreadTable.id))
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "thread"),
        ),
      )
      .orderBy(desc(BookmarkTable.createdAt));
  },

  async selectStarredProjects(userId) {
    return db
      .select({
        id: ProjectTable.id,
        name: ProjectTable.name,
        description: ProjectTable.description,
        createdAt: ProjectTable.createdAt,
        updatedAt: ProjectTable.updatedAt,
      })
      .from(BookmarkTable)
      .innerJoin(ProjectTable, eq(BookmarkTable.itemId, ProjectTable.id))
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "project"),
        ),
      )
      .orderBy(desc(BookmarkTable.createdAt));
  },
};
