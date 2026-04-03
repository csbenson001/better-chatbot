import { getTenantModelProvider } from "lib/ai/tenant-model-provider";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { handleError } from "../shared.chat";

export const GET = async (request: Request) => {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ??
      "00000000-0000-0000-0000-000000000000";

    const session = await getSession();
    const userId = session?.user.id;

    const [tenantProvider, userPreferred] = await Promise.all([
      getTenantModelProvider(tenantId),
      userId ? userRepository.getPreferredModel(userId) : Promise.resolve(null),
    ]);

    const models = tenantProvider.modelsInfo.slice().sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    });

    return Response.json({
      models,
      defaultModel: tenantProvider.defaultModel,
      userPreferred,
    });
  } catch (err) {
    return new Response(handleError(err), { status: 500 });
  }
};
