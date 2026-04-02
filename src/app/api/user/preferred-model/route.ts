import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";

const PreferredModelSchema = z.union([
  z.object({ provider: z.string().min(1), model: z.string().min(1) }),
  z.object({ clear: z.literal(true) }),
]);

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const data = PreferredModelSchema.parse(body);
    const model =
      "clear" in data
        ? null
        : { provider: data.provider, model: data.model };
    await userRepository.updatePreferredModel(session.user.id, model);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update preferred model" },
      { status: 500 },
    );
  }
}
