import { NextResponse } from "next/server";
import { billingRepository } from "lib/db/repository";
import { hasAdminPermission } from "lib/auth/permissions";

export async function GET() {
  if (!(await hasAdminPermission())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const subscriptions = await billingRepository.selectAllSubscriptions();

    return NextResponse.json({ subscriptions });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 },
    );
  }
}
