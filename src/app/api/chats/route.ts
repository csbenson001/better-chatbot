import { getSession } from "auth/server";
import { pgDb as db } from "lib/db/pg/db.pg";
import { ChatThreadTable } from "lib/db/pg/schema.pg";
import { and, count, desc, eq, like } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
  );
  const search = searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(ChatThreadTable.userId, session.user.id),
    search ? like(ChatThreadTable.title, `%${search}%`) : undefined,
  );

  const [threads, [{ total }]] = await Promise.all([
    db
      .select()
      .from(ChatThreadTable)
      .where(whereClause)
      .orderBy(desc(ChatThreadTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(ChatThreadTable).where(whereClause),
  ]);

  return Response.json({ threads, total, page, limit });
}
