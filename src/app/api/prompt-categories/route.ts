import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await promptRepository.selectEnabledCategories();
  return Response.json(categories);
}
