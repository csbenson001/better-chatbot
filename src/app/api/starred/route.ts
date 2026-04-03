import { getSession } from "auth/server";
import { bookmarkRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [threads, projects] = await Promise.all([
    bookmarkRepository.selectStarredThreads(session.user.id),
    bookmarkRepository.selectStarredProjects(session.user.id),
  ]);

  return Response.json({ threads, projects });
}
