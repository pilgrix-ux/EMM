import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const BUCKET = "emm-source-videos";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/3gpp",
]);
const SHOTSTACK_HOSTS = new Set(["cdn.shotstack.io"]);

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function text(value: unknown, max = 400) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeFilename(value: unknown) {
  return text(value, 180)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "source-video.mp4";
}

function validUuid(value: unknown) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validSourceId(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]{8,120}$/i.test(value);
}

function safeStoragePath(value: unknown) {
  const path = text(value, 500);
  return path && !path.includes("..") && !path.startsWith("/") && !path.includes("\\")
    ? path
    : "";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function resolveVisitor(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data, error } = await admin.rpc("register_workspace_visitor", { p_token: token });
  if (error || !validUuid(data)) return null;
  return data;
}

async function ownedProject(projectId: string, visitorId: string) {
  if (!validUuid(projectId)) return null;
  const { data, error } = await admin
    .from("ad_projects")
    .select("id, visitor_id, source_video_path")
    .eq("id", projectId)
    .eq("visitor_id", visitorId)
    .maybeSingle();
  return error ? null : data;
}

async function signDownload(path: string) {
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create a private video link.");
  }
  return data.signedUrl;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!supabaseUrl || !serviceKey) return json({ error: "Storage service is not configured." }, 503);

  const token = request.headers.get("x-workspace-token") ?? "";
  const body = await request.json().catch(() => ({}));
  const action = text(body?.action, 40);
  const visitorId = await resolveVisitor(token);
  if (!visitorId) return json({ error: "This browser workspace is invalid or has expired. Refresh the page and try again." }, 401);

  if (action === "register") {
    return json({ visitorId });
  }

  try {
    if (action === "track-event") {
      const eventName = text(body?.eventName, 40);
      const allowed = new Set([
        "workspace_started", "project_created", "video_uploaded",
        "ad_plan_generated", "render_started", "render_completed",
        "render_failed", "video_downloaded",
      ]);
      if (!allowed.has(eventName)) return json({ error: "Unsupported workspace event." }, 400);

      const projectId = text(body?.projectId, 80);
      if (projectId && !await ownedProject(projectId, visitorId)) {
        return json({ error: "This project was not found in the current browser workspace." }, 404);
      }

      const properties = body?.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
        ? body.properties
        : {};
      if (JSON.stringify(properties).length > 4000) {
        return json({ error: "The activity details are too large." }, 400);
      }

      const { error } = await admin.rpc("track_workspace_event", {
        p_token: token,
        p_event_name: eventName,
        p_project_id: projectId || null,
        p_properties: properties,
      });
      if (error) return json({ error: error.message || "Workspace activity could not be recorded." }, 502);
      return json({ ok: true });
    }

    const projectId = text(body?.projectId, 80);
    const project = await ownedProject(projectId, visitorId);
    if (!project) return json({ error: "This project was not found in the current browser workspace." }, 404);

    if (action === "create-upload") {
      const fileName = safeFilename(body?.fileName);
      const contentType = text(body?.contentType, 80).toLowerCase();
      const size = Number(body?.size);

      if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
        return json({ error: "Choose an MP4, MOV, WebM, M4V or 3GPP video." }, 400);
      }
      if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_BYTES) {
        return json({ error: "The video must be larger than 0 and no more than 100 MB." }, 413);
      }

      const path = `${visitorId}/${projectId}/${fileName}`;
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
      if (error || !data?.token) {
        return json({ error: error?.message || "Could not prepare the private video upload." }, 502);
      }
      return json({ path, token: data.token });
    }

    if (action === "sign-download") {
      const path = safeStoragePath(body?.path);
      const expectedPrefix = `${visitorId}/${projectId}/`;
      if (!path || !path.startsWith(expectedPrefix)) {
        return json({ error: "The requested video does not belong to this workspace project." }, 403);
      }

      const signedUrl = await signDownload(path);
      return json({ signedUrl });
    }

    if (action === "store-preview") {
      const sourceId = text(body?.sourceId, 120);
      const sourceUrlText = text(body?.sourceUrl, 2000);
      if (!validSourceId(sourceId)) return json({ error: "The preview source ID is invalid." }, 400);

      let sourceUrl: URL;
      try {
        sourceUrl = new URL(sourceUrlText);
      } catch {
        return json({ error: "The video provider returned an invalid preview URL." }, 502);
      }
      const allowedHost = sourceUrl.protocol === "https:"
        && (sourceUrl.hostname.endsWith(".amazonaws.com") || SHOTSTACK_HOSTS.has(sourceUrl.hostname));
      if (!allowedHost) return json({ error: "The video provider returned an untrusted preview host." }, 502);

      const mediaResponse = await fetch(sourceUrl.toString(), { cache: "no-store" });
      if (!mediaResponse.ok || !mediaResponse.body) {
        return json({ error: "The converted MP4 could not be retrieved from the video service." }, 502);
      }

      const contentLength = Number(mediaResponse.headers.get("content-length") || 0);
      if (contentLength > MAX_VIDEO_BYTES) {
        return json({ error: "The compatible preview is larger than the 100 MB storage limit." }, 413);
      }

      const media = new Uint8Array(await mediaResponse.arrayBuffer());
      if (!media.length || media.length > MAX_VIDEO_BYTES) {
        return json({ error: "The compatible preview is empty or exceeds the 100 MB storage limit." }, 413);
      }

      const path = `${visitorId}/${projectId}/preview-${sourceId}.mp4`;
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(
        path,
        new Blob([media], { type: "video/mp4" }),
        { contentType: "video/mp4", upsert: true, cacheControl: "3600" },
      );
      if (uploadError) {
        return json({ error: uploadError.message || "Could not save the compatible preview." }, 502);
      }

      const signedUrl = await signDownload(path);
      return json({ path, signedUrl });
    }

    return json({ error: "Unknown storage operation." }, 400);
  } catch (error) {
    return json({ error: text(error?.message, 260) || "The private video operation failed." }, 500);
  }
});
