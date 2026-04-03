import { systemPromptRepository } from "lib/db/repository";
import { notFound } from "next/navigation";
import { PromptEditor } from "./prompt-editor";

export default async function SystemPromptEditorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  if (decodedName === "new") {
    return (
      <PromptEditor
        promptName=""
        versions={[]}
        activeId={null}
        initialContent=""
      />
    );
  }

  const allVersions = await systemPromptRepository.listMeta();
  const versions = allVersions.filter((v) => v.name === decodedName);

  if (versions.length === 0) notFound();

  const active = versions.find((v) => v.isActive);
  const editorVersion = active ?? versions[0];
  const fullRow = await systemPromptRepository.getById(editorVersion.id);

  const versionsWithContent = versions.map((v) => ({
    ...v,
    content: v.id === fullRow?.id ? (fullRow?.content ?? "") : "",
  }));

  return (
    <PromptEditor
      promptName={decodedName}
      versions={versionsWithContent}
      activeId={active?.id ?? null}
      initialContent={fullRow?.content ?? ""}
    />
  );
}
