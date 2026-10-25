import { NextRequest, NextResponse } from "next/server";

const backendOrigin = () => (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const origin = backendOrigin();
    if (!origin) {
      return NextResponse.json(
        { error: "Server configuration error: BACKEND_API_URL missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const upstream = await fetch(`${origin}/api/v1/reconcile/queue?${searchParams.toString()}`, {
      headers: request.headers.get("authorization") ? { authorization: request.headers.get("authorization")! } : undefined,
      cache: "no-store",
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (error: any) {
    console.error("Error in /api/review-queue:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
