import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const UpdateCategorySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(100).optional(),
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
    const data = UpdateCategorySchema.parse(body);
    const category = await promptRepository.updateCategory(id, data);
    return Response.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error updating category:", error);
    return Response.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await promptRepository.deleteCategory(id);
  return new Response(null, { status: 204 });
}
