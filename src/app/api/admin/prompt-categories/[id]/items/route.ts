import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const CreateItemSchema = z.object({
  label: z.string().min(1).max(200),
  prompt: z.string().min(1),
  sequence: z.number().int().min(0),
  enabled: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const items = await promptRepository.selectItemsByCategory(id);
  return Response.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id: categoryId } = await params;
  try {
    const body = await request.json();
    const data = CreateItemSchema.parse(body);
    const item = await promptRepository.insertItem({ ...data, categoryId });
    return Response.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error creating item:", error);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}
