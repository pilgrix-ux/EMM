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

async function callWorkspaceBroker(token, payload) {
  const { supabaseUrl, publishableKey } = config();
  const response = await fetch(`${supabaseUrl}/functions/v1/workspace-storage`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "x-workspace-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "The private browser workspace could not be registered.");
  }
  return result;
}

async function registerWorkspace(token) {
  const result = await callWorkspaceBroker(token, { action: "register" });
  if (!/^[0-9a-f-]{36}$/i.test(String(result?.visitorId || ""))) {
    throw new Error("The private browser workspace could not be registered.");
  }
  return result.visitorId;
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
      await callWorkspaceBroker(token, {
        action: "track-event",
        eventName: "workspace_started",
        properties: { source: "web" },
      }).catch(() => null);
    }
    const response = NextResponse.json({ ok: true, visitorId });
    // Refresh the one-year browser workspace lifetime on each successful visit.
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_AGE,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "The private browser workspace could not start." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
