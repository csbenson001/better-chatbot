import Link from "next/link";
import { systemPromptRepository } from "lib/db/repository";

export default async function SystemPromptsPage() {
  const prompts = await systemPromptRepository.listMeta();

  const byName = prompts.reduce<Record<string, typeof prompts>>((acc, p) => {
    acc[p.name] = acc[p.name] ?? [];
    acc[p.name].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            System Prompts
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Versioned prompt vault — superadmin only
          </p>
        </div>
        <Link
          href="/superadmin/system-prompts/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
        >
          New Prompt
        </Link>
      </div>

      {Object.keys(byName).length === 0 ? (
        <div className="text-zinc-500 text-sm">
          No system prompts yet. Create one to override the hardcoded default.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byName).map(([name, versions]) => {
            const active = versions.find((v) => v.isActive);
            const latest = versions[0];
            return (
              <div
                key={name}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-100 font-medium">{name}</span>
                      {active ? (
                        <span className="text-xs px-2 py-0.5 bg-green-900/40 text-green-400 rounded-full border border-green-800">
                          v{active.version} active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full">
                          no active version
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">
                      {versions.length} version
                      {versions.length !== 1 ? "s" : ""} · latest: v
                      {latest.version} by {latest.createdBy.slice(0, 8)}… ·{" "}
                      {new Date(latest.updatedAt).toLocaleDateString()}
                    </p>
                    {latest.description && (
                      <p className="text-zinc-400 text-sm mt-1">
                        {latest.description}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/superadmin/system-prompts/${encodeURIComponent(name)}`}
                    className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                  >
                    Edit / View History
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
