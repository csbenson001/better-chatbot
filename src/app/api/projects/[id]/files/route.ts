import { getSession } from "auth/server";
import { projectRepository } from "lib/db/repository";
import { serverFileStorage } from "lib/file-storage";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const session = await getSession();
  if (!session?.user.id) return new Response("Unauthorized", { status: 401 });

  const project = await projectRepository.selectProjectById(
    projectId,
    session.user.id,
  );
  if (!project) return new Response("Not Found", { status: 404 });

  // Check file count
  const existingFiles = await projectRepository.selectProjectFiles(projectId);
  if (existingFiles.length >= MAX_FILES) {
    return Response.json(
      { error: `Maximum ${MAX_FILES} files per project` },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file)
    return Response.json({ message: "No file provided" }, { status: 400 });

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File exceeds the 10 MB limit" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await serverFileStorage.upload(buffer, {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  });

  const projectFile = await projectRepository.insertProjectFile({
    projectId,
    userId: session.user.id,
    storageKey: result.key,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  });

  return Response.json(projectFile, { status: 201 });
}
