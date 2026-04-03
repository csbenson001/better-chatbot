import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const UpdateItemSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  prompt: z.string().min(1).optional(),
  sequence: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const data = UpdateItemSchema.parse(body);
    const item = await promptRepository.updateItem(id, data);
    return Response.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error updating item:", error);
    return Response.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await promptRepository.deleteItem(id);
  return new Response(null, { status: 204 });
}
