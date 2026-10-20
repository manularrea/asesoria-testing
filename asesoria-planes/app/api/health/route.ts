import { NextResponse } from "next/server";
import { paymentsProvider } from "@/lib/payments";
import { PLANES } from "@/lib/plans";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "asesoria-planes",
    version: process.env.npm_package_version ?? "0.1.0",
    paymentsProvider: paymentsProvider().name,
    planes: PLANES.map((p) => p.id),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
