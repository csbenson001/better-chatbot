import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import type { LanguageModel } from "ai";
import type { ChatModel } from "app-types/chat";
import type { TenantProviderKey } from "app-types/model-config";
import { customModelProvider } from "./models";
import { tenantModelConfigRepository } from "lib/db/repository";

type ProviderFn = (modelId: string) => LanguageModel;

function buildProviderFn(pk: TenantProviderKey): ProviderFn | null {
  switch (pk.provider) {
    case "openai": {
      const p = createOpenAI({ apiKey: pk.apiKey });
      return (modelId) => p(modelId) as unknown as LanguageModel;
    }
    case "anthropic": {
      const p = createAnthropic({ apiKey: pk.apiKey });
      return (modelId) => p(modelId) as unknown as LanguageModel;
    }
    case "google": {
      const p = createGoogleGenerativeAI({ apiKey: pk.apiKey });
      return (modelId) => p(modelId) as unknown as LanguageModel;
    }
    case "azure": {
      if (!pk.azureEndpoint || !pk.azureDeploymentName) return null;
      // baseURL format: {endpoint}/openai/deployments — Azure SDK appends /v1{path}
      const p = createAzure({
        baseURL: `${pk.azureEndpoint}/openai/deployments`,
        apiKey: pk.apiKey,
        apiVersion: pk.azureApiVersion ?? "2024-02-01",
      });
      return (modelId) => p(modelId) as unknown as LanguageModel;
    }
    default:
      return null;
  }
}

export async function getTenantModelProvider(tenantId: string) {
  const [providerKeys, modelSettings] = await Promise.all([
    tenantModelConfigRepository.getProviderKeys(tenantId),
    tenantModelConfigRepository.getModelSettings(tenantId),
  ]);

  // No DB config — fall back to static env-var-based provider
  if (providerKeys.length === 0) {
    return {
      modelsInfo: customModelProvider.modelsInfo,
      defaultModel: null as ChatModel | null,
      getModel: (chatModel?: ChatModel) =>
        customModelProvider.getModel(chatModel),
    };
  }

  // Build provider functions for each enabled provider
  const providerFns = new Map<string, ProviderFn>();
  for (const pk of providerKeys) {
    if (!pk.enabled) continue;
    const fn = buildProviderFn(pk);
    if (fn) providerFns.set(pk.provider, fn);
  }

  // Build per-provider sets of enabled model names
  const enabledByProvider = new Map<string, Set<string>>();
  for (const ms of modelSettings) {
    if (!enabledByProvider.has(ms.provider)) {
      enabledByProvider.set(ms.provider, new Set());
    }
    if (ms.enabled) enabledByProvider.get(ms.provider)!.add(ms.modelName);
  }

  const defaultSetting = modelSettings.find((ms) => ms.isDefault && ms.enabled);
  const defaultModel: ChatModel | null = defaultSetting
    ? { provider: defaultSetting.provider, model: defaultSetting.modelName }
    : null;

  // Filter static models to only enabled ones for configured providers
  const staticModelsInfo = customModelProvider.modelsInfo
    .filter((p) => providerFns.has(p.provider))
    .map((p) => {
      const enabledSet = enabledByProvider.get(p.provider);
      const models =
        !enabledSet || enabledSet.size === 0
          ? p.models
          : p.models.filter((m) => enabledSet.has(m.name));
      return { ...p, hasAPIKey: true, models };
    })
    .filter((p) => p.models.length > 0);

  // Add Azure as a dynamic single-model entry when configured
  const azureKey = providerKeys.find(
    (pk) => pk.provider === "azure" && pk.enabled && pk.azureDeploymentName,
  );
  const azureEntry =
    azureKey && providerFns.has("azure")
      ? [
          {
            provider: "azure" as const,
            hasAPIKey: true,
            models: [
              {
                name: azureKey.azureDeploymentName!,
                isToolCallUnsupported: false,
                isImageInputUnsupported: false,
                supportedFileMimeTypes: [] as string[],
              },
            ],
          },
        ]
      : [];

  const modelsInfo = [...staticModelsInfo, ...azureEntry];

  const getModel = (chatModel?: ChatModel): LanguageModel => {
    if (!chatModel) {
      if (defaultModel) {
        const fn = providerFns.get(defaultModel.provider);
        if (fn) return fn(defaultModel.model);
      }
      return customModelProvider.getModel(undefined);
    }
    const fn = providerFns.get(chatModel.provider);
    if (fn) return fn(chatModel.model);
    return customModelProvider.getModel(chatModel);
  };

  return { modelsInfo, defaultModel, getModel };
}
