import { NextResponse } from "next/server";
import { getWorkspaceContext, trackWorkspaceEvent } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "workspace_started", "project_created", "video_uploaded",
  "ad_plan_generated", "render_started", "render_completed",
  "render_failed", "video_downloaded",
]);

export async function POST(request) {
  try {
    const context = await getWorkspaceContext();
    const body = await request.json().catch(() => ({}));
    const eventName = String(body?.eventName || "");
    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Unsupported workspace event." }, { status: 400 });
    }
    const properties = body?.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
      ? body.properties
      : {};
    if (JSON.stringify(properties).length > 4000) {
      return NextResponse.json({ error: "The activity details are too large." }, { status: 400 });
    }
    await trackWorkspaceEvent(context, eventName, body?.projectId || null, properties);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Workspace activity could not be recorded." },
      { status: error?.status || 500 }
    );
  }
}
