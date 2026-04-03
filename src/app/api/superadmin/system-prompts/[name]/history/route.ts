import { NextResponse } from "next/server";
import { requireSuperadminPermission } from "lib/auth/permissions";
import { systemPromptRepository } from "lib/db/repository";

// GET /api/superadmin/system-prompts/[name]/history — audit log (no content)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    await requireSuperadminPermission("view system prompt history");
    const { name } = await params;
    const history = await systemPromptRepository.getAuditLog(name);
    return NextResponse.json(history);
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
