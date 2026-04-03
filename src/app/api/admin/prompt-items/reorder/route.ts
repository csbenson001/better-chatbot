import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sequence: z.number().int().min(0),
    }),
  ),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const { items } = ReorderSchema.parse(body);
    await promptRepository.reorderItems(items);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error reordering items:", error);
    return Response.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}
