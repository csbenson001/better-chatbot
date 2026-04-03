export type SupportedProvider = "openai" | "anthropic" | "google" | "azure";

export type TenantProviderKey = {
  id: string;
  tenantId: string;
  provider: SupportedProvider;
  apiKey: string;
  enabled: boolean;
  azureEndpoint: string | null;
  azureDeploymentName: string | null;
  azureApiVersion: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantProviderKeyMasked = Omit<TenantProviderKey, "apiKey"> & {
  apiKeyMasked: string; // e.g. "sk-ant-••••••••4f2a"
};

export type TenantModelSetting = {
  id: string;
  tenantId: string;
  provider: SupportedProvider;
  modelName: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertProviderKeyData = {
  apiKey: string;
  enabled: boolean;
  azureEndpoint?: string | null;
  azureDeploymentName?: string | null;
  azureApiVersion?: string | null;
};

export type UpsertModelSettingData = {
  enabled: boolean;
  isDefault?: boolean;
};

export type BulkModelSettingInput = {
  provider: SupportedProvider;
  modelName: string;
  enabled?: boolean;
  isDefault?: boolean;
};

export type TenantModelConfig = {
  providerKeys: TenantProviderKey[];
  modelSettings: TenantModelSetting[];
};

export type TenantModelConfigRepository = {
  getProviderKeys: (tenantId: string) => Promise<TenantProviderKey[]>;
  getProviderKey: (
    tenantId: string,
    provider: SupportedProvider,
  ) => Promise<TenantProviderKey | null>;
  upsertProviderKey: (
    tenantId: string,
    provider: SupportedProvider,
    data: UpsertProviderKeyData,
  ) => Promise<TenantProviderKey>;
  deleteProviderKey: (
    tenantId: string,
    provider: SupportedProvider,
  ) => Promise<void>;
  getModelSettings: (tenantId: string) => Promise<TenantModelSetting[]>;
  upsertModelSetting: (
    tenantId: string,
    provider: SupportedProvider,
    modelName: string,
    data: UpsertModelSettingData,
  ) => Promise<TenantModelSetting>;
  setDefaultModel: (
    tenantId: string,
    provider: SupportedProvider,
    modelName: string,
  ) => Promise<void>;
  bulkUpsertModelSettings: (
    tenantId: string,
    settings: BulkModelSettingInput[],
  ) => Promise<void>;
  getTenantModelConfig: (tenantId: string) => Promise<TenantModelConfig>;
};
