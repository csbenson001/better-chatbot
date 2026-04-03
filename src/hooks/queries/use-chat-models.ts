import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";
import type { ChatModel } from "app-types/chat";

type ModelInfo = {
  name: string;
  isToolCallUnsupported: boolean;
  isImageInputUnsupported: boolean;
  supportedFileMimeTypes: string[];
};

export type ProviderInfo = {
  provider: string;
  hasAPIKey: boolean;
  models: ModelInfo[];
};

export type ChatModelsResponse = {
  models: ProviderInfo[];
  defaultModel: ChatModel | null;
  userPreferred: ChatModel | null;
};

export const useChatModels = (options?: SWRConfiguration) => {
  return useSWR<ChatModelsResponse>("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: { models: [], defaultModel: null, userPreferred: null },
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        // Priority: user preferred > tenant default > first available model
        const toSet = data.userPreferred ?? data.defaultModel;
        if (toSet) {
          appStore.setState({ chatModel: toSet });
        } else if (data.models.length > 0 && data.models[0].models.length > 0) {
          appStore.setState({
            chatModel: {
              provider: data.models[0].provider,
              model: data.models[0].models[0].name,
            },
          });
        }
      }
    },
    ...options,
  });
};
