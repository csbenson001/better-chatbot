import { NextResponse } from "next/server";
import { requireSuperadminPermission } from "lib/auth/permissions";
import { getSession } from "auth/server";
import { systemPromptRepository } from "lib/db/repository";

// POST /api/superadmin/system-prompts/[name]/activate
// Body: { id: string } — the specific version id to activate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    await requireSuperadminPermission("activate system prompt version");
    const session = await getSession();
    await params; // consume params (name used for context only)
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    await systemPromptRepository.activateVersion(id, session!.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
