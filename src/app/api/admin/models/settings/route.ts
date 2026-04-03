import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantModelConfigRepository } from "lib/db/repository";
import { customModelProvider } from "lib/ai/models";

const BulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      provider: z.enum(["openai", "anthropic", "google", "azure"]),
      modelName: z.string().min(1),
      enabled: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }),
  ),
});

export async function GET(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";

    const dbSettings =
      await tenantModelConfigRepository.getModelSettings(tenantId);
    const dbMap = new Map(
      dbSettings.map((s) => [`${s.provider}:${s.modelName}`, s]),
    );

    // Merge full static model list with DB overrides so UI can show all models
    const settings = customModelProvider.modelsInfo.flatMap((providerInfo) =>
      providerInfo.models.map((m) => {
        const key = `${providerInfo.provider}:${m.name}`;
        const db = dbMap.get(key);
        return {
          tenantId,
          provider: providerInfo.provider,
          modelName: m.name,
          enabled: db?.enabled ?? true,
          isDefault: db?.isDefault ?? false,
          isToolCallUnsupported: m.isToolCallUnsupported,
        };
      }),
    );

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch model settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";
    const body = await request.json();
    const { updates } = BulkUpdateSchema.parse(body);
    await tenantModelConfigRepository.bulkUpsertModelSettings(
      tenantId,
      updates,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update model settings" },
      { status: 500 },
    );
  }
}
