import { NextResponse } from "next/server";
import { getWorkspaceContext, workspaceStorage } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request) {
  try {
    const context = await getWorkspaceContext();
    const body = await request.json().catch(() => ({}));
    const result = await workspaceStorage(context, {
      action: "create-upload",
      projectId: body?.projectId,
      fileName: body?.fileName,
      contentType: body?.contentType,
      size: body?.size,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "A private upload could not be prepared." },
      { status: error?.status || 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
