import { NextResponse } from "next/server";
import { prospectingRepository } from "lib/db/repository";
import { ProspectSignalCreateSchema } from "app-types/prospecting";
import type { SignalType } from "app-types/prospecting";
import { z } from "zod";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(request.url);

    const signalType = searchParams.get("signalType") as SignalType | null;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, Number(searchParams.get("limit"))))
      : 50;

    const signals = await prospectingRepository.selectSignalsByProspectId(
      id,
      tenantId,
      {
        signalType: signalType || undefined,
        limit,
      },
    );

    return NextResponse.json({ data: signals });
  } catch (error) {
    console.error("Failed to fetch signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
    const body = await request.json();

    const data = ProspectSignalCreateSchema.parse({
      ...body,
      prospectId: id,
      tenantId,
    });
    const signal = await prospectingRepository.insertProspectSignal(data);

    return NextResponse.json({ data: signal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid signal data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create signal:", error);
    return NextResponse.json(
      { error: "Failed to create signal" },
      { status: 500 },
    );
  }
}
