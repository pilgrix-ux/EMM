import { NextResponse } from "next/server";
import { getWorkspaceContext, workspaceHeaders } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function readRows(response) {
  return response.json().catch(() => []);
}

function cleanFields(input) {
  const allowed = [
    "title", "status", "source_video_path", "source_video_name",
    "source_video_mime_type", "source_video_size_bytes", "product_name",
    "product_benefit", "audience", "ad_goal", "platform", "aspect_ratio",
    "target_duration_seconds", "language", "ad_plan", "creative_settings",
    "ad_plan_approved_at",
  ];
  const result = {};
  for (const key of allowed) {
    if (Object.hasOwn(input || {}, key)) result[key] = input[key];
  }
  return result;
}

export async function GET() {
  try {
    const context = await getWorkspaceContext();
    const query = new URLSearchParams({
      select: "id,title,status,source_video_name,created_at,updated_at",
      visitor_id: `eq.${context.visitorId}`,
      order: "created_at.desc",
      limit: "100",
    });
    const response = await fetch(`${context.supabaseUrl}/rest/v1/ad_projects?${query}`, {
      headers: workspaceHeaders(context),
      cache: "no-store",
    });
    const rows = await readRows(response);
    if (!response.ok) return json({ error: rows?.message || "Your projects could not be loaded." }, 502);

    const projects = Array.isArray(rows) ? rows : [];
    return json({
      projects,
      stats: {
        total: projects.length,
        plans: projects.filter((project) => ["plan_ready", "approved", "rendering", "done", "complete"].includes(project.status)).length,
        completed: projects.filter((project) => ["done", "complete"].includes(project.status)).length,
      },
    });
  } catch (error) {
    return json({ error: error?.message || "Your workspace could not be loaded." }, error?.status || 500);
  }
}

export async function POST(request) {
  try {
    const context = await getWorkspaceContext();
    const body = await request.json().catch(() => ({}));
    const fields = cleanFields(body?.fields);
    if (!fields.product_name || !fields.product_benefit) {
      return json({ error: "Add what you are advertising and its main benefit." }, 400);
    }

    const record = { ...fields, user_id: null, visitor_id: context.visitorId };
    const response = await fetch(`${context.supabaseUrl}/rest/v1/ad_projects`, {
      method: "POST",
      headers: workspaceHeaders(context, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(record),
      cache: "no-store",
    });
    const result = await readRows(response);
    if (!response.ok || !Array.isArray(result) || !result[0]?.id) {
      return json({ error: result?.message || "Your ad project could not be saved." }, response.status === 400 ? 400 : 502);
    }
    return json({ project: result[0] }, 201);
  } catch (error) {
    return json({ error: error?.message || "Your ad project could not be saved." }, error?.status || 500);
  }
}

export async function PATCH(request) {
  try {
    const context = await getWorkspaceContext();
    const body = await request.json().catch(() => ({}));
    const projectId = String(body?.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) return json({ error: "A valid project is required." }, 400);

    const fields = cleanFields(body?.fields);
    if (!Object.keys(fields).length) return json({ error: "There are no project changes to save." }, 400);
    const query = new URLSearchParams({
      id: `eq.${projectId}`,
      visitor_id: `eq.${context.visitorId}`,
    });
    const response = await fetch(`${context.supabaseUrl}/rest/v1/ad_projects?${query}`, {
      method: "PATCH",
      headers: workspaceHeaders(context, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(fields),
      cache: "no-store",
    });
    const result = await readRows(response);
    if (!response.ok) return json({ error: result?.message || "Your project changes could not be saved." }, 502);
    if (!Array.isArray(result) || !result[0]) return json({ error: "This project is not in the current browser workspace." }, 404);
    return json({ project: result[0] });
  } catch (error) {
    return json({ error: error?.message || "Your project changes could not be saved." }, error?.status || 500);
  }
}
