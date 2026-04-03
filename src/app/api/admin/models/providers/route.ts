import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "auth/server";
import { tenantModelConfigRepository } from "lib/db/repository";
import { maskApiKey } from "lib/db/pg/repositories/tenant-model-config-repository.pg";
import type { TenantProviderKey } from "app-types/model-config";

const UpsertProviderSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "azure"]),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(true),
  azureEndpoint: z.string().url().optional().nullable(),
  azureDeploymentName: z.string().optional().nullable(),
  azureApiVersion: z.string().optional().nullable(),
});

function maskProvider(pk: TenantProviderKey) {
  const { apiKey, ...rest } = pk;
  return { ...rest, apiKeyMasked: maskApiKey(apiKey) };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user || !["admin", "super_admin"].includes((session.user as any).role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const keys = await tenantModelConfigRepository.getProviderKeys(tenantId);
    return NextResponse.json({ providers: keys.map(maskProvider) });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch provider keys" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.user || !["admin", "super_admin"].includes((session.user as any).role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = UpsertProviderSchema.parse(body);

    // If no new apiKey was provided, preserve the existing key from DB
    let resolvedApiKey = data.apiKey && data.apiKey.length > 0 ? data.apiKey : null;
    if (!resolvedApiKey) {
      const existing = await tenantModelConfigRepository.getProviderKey(tenantId, data.provider);
      if (!existing) {
        return NextResponse.json({ error: "apiKey is required for new providers" }, { status: 400 });
      }
      resolvedApiKey = existing.apiKey;
    }

    const result = await tenantModelConfigRepository.upsertProviderKey(
      tenantId,
      data.provider,
      {
        apiKey: resolvedApiKey,
        enabled: data.enabled,
        azureEndpoint: data.azureEndpoint ?? null,
        azureDeploymentName: data.azureDeploymentName ?? null,
        azureApiVersion: data.azureApiVersion ?? null,
      },
    );
    return NextResponse.json({ provider: maskProvider(result) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save provider key" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.user || !["admin", "super_admin"].includes((session.user as any).role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    if (!provider) {
      return NextResponse.json(
        { error: "provider query param required" },
        { status: 400 },
      );
    }
    await tenantModelConfigRepository.deleteProviderKey(
      tenantId,
      provider as "openai" | "anthropic" | "google" | "azure",
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete provider key" },
      { status: 500 },
    );
  }
}
