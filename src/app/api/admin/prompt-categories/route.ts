import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const CreateCategorySchema = z.object({
  label: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const categories = await promptRepository.selectAllCategories();
  return Response.json(categories);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const data = CreateCategorySchema.parse(body);
    const category = await promptRepository.insertCategory(data);
    return Response.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error creating category:", error);
    return Response.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
