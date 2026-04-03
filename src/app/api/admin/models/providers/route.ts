import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantModelConfigRepository, maskApiKey } from "lib/db/repository";
import type { TenantProviderKey } from "app-types/model-config";
import { hasAdminPermission } from "lib/auth/permissions";

const UpsertProviderSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "azure"]),
  apiKey: z.string().min(1),
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
  if (!(await hasAdminPermission())) {
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
  if (!(await hasAdminPermission())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const data = UpsertProviderSchema.parse(body);
    const result = await tenantModelConfigRepository.upsertProviderKey(
      tenantId,
      data.provider,
      {
        apiKey: data.apiKey,
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
  if (!(await hasAdminPermission())) {
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
    const providerEnum = z.enum(["openai", "anthropic", "google", "azure"]);
    const parsed = providerEnum.safeParse(provider);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid provider" }, { status: 400 });
    }
    await tenantModelConfigRepository.deleteProviderKey(tenantId, parsed.data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete provider key" },
      { status: 500 },
    );
  }
}
