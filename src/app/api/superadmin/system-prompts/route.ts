import { NextResponse } from "next/server";
import { requireSuperadminPermission } from "lib/auth/permissions";
import { getSession } from "auth/server";
import { systemPromptRepository } from "lib/db/repository";

// GET /api/superadmin/system-prompts — list metadata (no content field)
export async function GET() {
  try {
    await requireSuperadminPermission("list system prompts");
    const prompts = await systemPromptRepository.listMeta();
    return NextResponse.json(prompts);
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/superadmin/system-prompts — create a new version
// Body: { name: string, description?: string, content: string }
export async function POST(request: Request) {
  try {
    await requireSuperadminPermission("create system prompt version");
    const session = await getSession();
    const body = await request.json();
    const { name, description, content } = body as {
      name: string;
      description?: string;
      content: string;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "name is required" },
        { status: 400 },
      );
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { message: "content is required" },
        { status: 400 },
      );
    }

    const result = await systemPromptRepository.createVersion({
      name: name.trim(),
      description: description?.trim(),
      content: content.trim(),
      createdBy: session!.user.id,
    });

    // Return metadata only — no content in response
    const { ...meta } = result;
    return NextResponse.json(meta, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
