import { cookies } from "next/headers";

const COOKIE_NAME = "emm_workspace";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error("The Pilgrix workspace connection is not configured.");
  }
  return { supabaseUrl, publishableKey };
}

function headersForWorkspace(context, extra = {}) {
  return {
    apikey: context.publishableKey,
    "x-workspace-token": context.token,
    ...extra,
  };
}

async function invokeWorkspaceStorage(token, supabaseUrl, publishableKey, payload) {
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
    const error = new Error(
      typeof result?.error === "string" ? result.error : "The private workspace service could not complete this request."
    );
    error.status = response.status;
    throw error;
  }
  return result;
}

export async function getWorkspaceContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value || "";
  if (!TOKEN_PATTERN.test(token)) {
    const error = new Error("Your private browser workspace has not started. Refresh the page and try again.");
    error.status = 401;
    throw error;
  }

  const { supabaseUrl, publishableKey } = getSupabaseConfig();
  const registration = await invokeWorkspaceStorage(
    token,
    supabaseUrl,
    publishableKey,
    { action: "register" }
  );
  if (!/^[0-9a-f-]{36}$/i.test(String(registration?.visitorId || ""))) {
    const error = new Error("Your private browser workspace could not be verified. Refresh the page to start a new workspace.");
    error.status = 503;
    throw error;
  }

  return { token, visitorId: registration.visitorId, supabaseUrl, publishableKey };
}

export function workspaceHeaders(context, extra = {}) {
  return headersForWorkspace(context, extra);
}

export async function workspaceStorage(context, payload) {
  return invokeWorkspaceStorage(
    context.token,
    context.supabaseUrl,
    context.publishableKey,
    payload
  );
}

export async function trackWorkspaceEvent(context, eventName, projectId = null, properties = {}) {
  await workspaceStorage(context, {
    action: "track-event",
    eventName,
    projectId,
    properties: properties && typeof properties === "object" ? properties : {},
  });
}
