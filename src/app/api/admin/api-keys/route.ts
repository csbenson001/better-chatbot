import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { rbacRepository } from "lib/db/repository";
import { ApiKeyCreateSchema } from "app-types/rbac";

export async function GET(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const keys = await rbacRepository.selectApiKeysByTenantId(tenantId);
    return NextResponse.json({ data: keys });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = ApiKeyCreateSchema.parse({ ...body, tenantId });

    // Generate a random API key
    const rawKey = `sk_${randomUUID().replace(/-/g, "")}`;
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await rbacRepository.insertApiKey({
      ...data,
      keyHash,
      keyPrefix,
    });

    // Return the raw key only on creation (never stored or returned again)
    return NextResponse.json(
      {
        data: {
          ...apiKey,
          rawKey,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid API key data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}
