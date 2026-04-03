import { getSession } from "auth/server";
import type { ReactNode } from "react";
import Link from "next/link";

export default async function SuperadminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <p className="text-6xl font-bold text-red-500">403</p>
          <p className="text-zinc-400 mt-2">Forbidden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">
            Superadmin
          </p>
          <p className="text-zinc-500 text-xs mt-1">Restricted access</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/superadmin/system-prompts"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            System Prompts
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
