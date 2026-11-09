import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "emm_workspace";
const COOKIE_AGE = 60 * 60 * 24 * 365;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function config() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error("The Pilgrix workspace connection is not configured.");
  }
  return { supabaseUrl, publishableKey };
}

async function registerWorkspace(token) {
  const { supabaseUrl, publishableKey } = config();
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/register_workspace_visitor`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "x-workspace-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token }),
    cache: "no-store",
  });
  const visitorId = await response.json().catch(() => null);
  if (!response.ok || !/^[0-9a-f-]{36}$/i.test(String(visitorId || ""))) {
    throw new Error("The private browser workspace could not be registered.");
  }
  return visitorId;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value || "";
    let created = false;

    if (!TOKEN_PATTERN.test(token)) {
      token = randomBytes(32).toString("base64url");
      created = true;
    }

    const visitorId = await registerWorkspace(token);
    if (created) {
      const { supabaseUrl, publishableKey } = config();
      await fetch(`${supabaseUrl}/rest/v1/rpc/track_workspace_event`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "x-workspace-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_event_name: "workspace_started",
          p_project_id: null,
          p_properties: { source: "web" },
        }),
        cache: "no-store",
      }).catch(() => null);
    }
    const response = NextResponse.json({ ok: true, visitorId });
    if (created) {
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_AGE,
      });
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "The private browser workspace could not start." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
