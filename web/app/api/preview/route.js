import { getWorkspaceContext, workspaceStorage } from "../../../lib/supabase/server";

import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "emm-source-videos";

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function cleanText(value, max = 400) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function readResponse(response) {
  return response.json().catch(() => ({}));
}

function getProviderConfig() {
  const environment = process.env.SHOTSTACK_ENV === "v1" ? "v1" : "stage";
  const apiKey = environment === "v1"
    ? process.env.SHOTSTACK_PRODUCTION_API_KEY || process.env.SHOTSTACK_API_KEY
    : process.env.SHOTSTACK_SANDBOX_API_KEY || process.env.SHOTSTACK_API_KEY;

  if (!apiKey) {
    const keyName = environment === "v1"
      ? "SHOTSTACK_PRODUCTION_API_KEY"
      : "SHOTSTACK_SANDBOX_API_KEY";
    throw new ApiError(`Add ${keyName} to Vercel and redeploy to enable compatible previews.`, 503);
  }

  return {
    apiKey,
    environment,
    ingestBaseUrl: `https://api.shotstack.io/ingest/${environment}`,
  };
}

async function authorize() {
  try {
    return await getWorkspaceContext();
  } catch (error) {
    throw new ApiError(error?.message || "Your private browser workspace could not be verified.", error?.status || 401);
  }
}

async function createPrivateSourceUrl(storagePath, projectId, auth) {
  const result = await workspaceStorage(auth, {
    action: "sign-download",
    projectId,
    path: storagePath,
  });
  if (!result?.signedUrl) {
    throw new ApiError("Pilgrix could not prepare the private video for conversion.", 502);
  }
  return result.signedUrl;
}

async function shotstackFetch(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const data = await readResponse(response);
  if (!response.ok) {
    const detail = cleanText(
      data?.errors?.[0]?.detail
        || data?.data?.attributes?.error
        || data?.response?.message
        || data?.message
        || data?.error,
      280
    );
    throw new ApiError(detail || "The video service could not prepare a compatible preview.", 502);
  }
  return data;
}

function createPreviewToken(sourceId, projectId, visitorId, apiKey) {
  const payload = Buffer.from(JSON.stringify({
    sourceId,
    projectId,
    visitorId,
    expiresAt: Date.now() + 60 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", apiKey).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyPreviewToken(token, visitorId, apiKey) {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) {
    throw new ApiError("This preview session is invalid. Prepare the preview again.", 400);
  }

  const expected = createHmac("sha256", apiKey).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    throw new ApiError("This preview session is invalid. Prepare the preview again.", 400);
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new ApiError("This preview session is invalid. Prepare the preview again.", 403);
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new ApiError("This preview session is invalid. Prepare the preview again.", 400);
  }
  if (decoded.visitorId !== visitorId || !/^[0-9a-f-]{36}$/i.test(decoded.projectId || "")) {
    throw new ApiError("This preview belongs to a different browser workspace.", 403);
  }
  if (!Number.isFinite(decoded.expiresAt) || decoded.expiresAt < Date.now()) {
    throw new ApiError("This preview session has expired. Prepare the preview again.", 410);
  }
  if (!/^[a-z0-9-]{8,120}$/i.test(decoded.sourceId || "")) {
    throw new ApiError("This preview session is invalid. Prepare the preview again.", 400);
  }
  return decoded;
}

async function handlePost(request) {
  const provider = getProviderConfig();
  const auth = await authorize();
  const body = await request.json().catch(() => ({}));
  const projectId = cleanText(body?.projectId, 80);
  const storagePath = cleanText(body?.storagePath, 500);
  const parts = storagePath.split("/");

  if (
    !/^[0-9a-f-]{36}$/i.test(projectId)
    || parts.length !== 4
    || parts[0] !== auth.visitorId
    || parts[1] !== projectId
    || parts[2] !== "preview"
    || !/^[a-z0-9._-]{1,180}$/i.test(parts[3])
    || storagePath.includes("..")
  ) {
    throw new ApiError("The temporary video path is invalid for this browser workspace.", 403);
  }

  const sourceUrl = await createPrivateSourceUrl(storagePath, projectId, auth);
  const queued = await shotstackFetch(`${provider.ingestBaseUrl}/sources`, provider.apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: sourceUrl,
      outputs: {
        renditions: [{
          format: "mp4",
          resolution: "mobile",
          fps: 25,
          quality: 72,
          filename: "emm-compatible-preview",
        }],
      },
    }),
  });

  const sourceId = cleanText(queued?.data?.id || queued?.data?.attributes?.id, 120);
  if (!sourceId) {
    throw new ApiError("The video service did not return a preview conversion ID.", 502);
  }

  return json({
    token: createPreviewToken(sourceId, projectId, auth.visitorId, provider.apiKey),
    status: "queued",
    message: "Your video is being converted into a browser-friendly MP4.",
  }, 202);
}

async function handleGet(request) {
  const provider = getProviderConfig();
  const auth = await authorize();
  const url = new URL(request.url);
  const preview = verifyPreviewToken(url.searchParams.get("token"), auth.visitorId, provider.apiKey);

  const result = await shotstackFetch(
    `${provider.ingestBaseUrl}/sources/${encodeURIComponent(preview.sourceId)}`,
    provider.apiKey
  );
  const attributes = result?.data?.attributes || {};
  const sourceStatus = cleanText(attributes.status, 40).toLowerCase();
  const rendition = Array.isArray(attributes?.outputs?.renditions)
    ? attributes.outputs.renditions[0]
    : null;
  const renditionStatus = cleanText(rendition?.status, 40).toLowerCase();
  const sourceIngested = sourceStatus === "ready" || sourceStatus === "failed";

  // If a previous ready response was interrupted after Shotstack deletion,
  // re-issue a signed link to the already-copied private Supabase rendition.
  if (sourceStatus === "deleted") {
    const storagePath = `${auth.visitorId}/${preview.projectId}/preview-${preview.sourceId}.mp4`;
    const saved = await workspaceStorage(auth, {
      action: "sign-download",
      projectId: preview.projectId,
      path: storagePath,
    });
    if (!saved?.signedUrl) {
      throw new ApiError("The temporary conversion has ended, but Pilgrix could not recover the private preview. Prepare it again.", 409);
    }
    return json({
      status: "ready",
      sourceIngested: true,
      url: saved.signedUrl,
      storagePath,
      message: "Compatible MP4 ready in your private Pilgrix workspace.",
    });
  }

  if (sourceStatus === "failed" || renditionStatus === "failed") {
    return json({
      status: "failed",
      sourceIngested,
      message: cleanText(rendition?.error || attributes?.error, 260)
        || "The video service could not convert this file. Try another clip.",
    });
  }

  if (sourceStatus === "ready" && renditionStatus === "ready" && rendition?.url) {
    let previewUrl;
    try {
      previewUrl = new URL(rendition.url);
    } catch {
      throw new ApiError("The converted preview returned an invalid video URL.", 502);
    }
    const validHost = previewUrl.protocol === "https:"
      && (previewUrl.hostname.endsWith(".amazonaws.com") || previewUrl.hostname === "cdn.shotstack.io");
    if (!validHost) {
      throw new ApiError("The converted preview returned an untrusted video host.", 502);
    }

    const saved = await workspaceStorage(auth, {
      action: "store-preview",
      projectId: preview.projectId,
      sourceId: preview.sourceId,
      sourceUrl: previewUrl.toString(),
    });
    if (!saved?.signedUrl || !saved?.path) {
      throw new ApiError("Pilgrix could not save the converted preview to your private workspace.", 502);
    }

    // Shotstack's DELETE /sources/{id} also deletes generated renditions.
    await shotstackFetch(
      `${provider.ingestBaseUrl}/sources/${encodeURIComponent(preview.sourceId)}`,
      provider.apiKey,
      { method: "DELETE" }
    );

    return json({
      status: "ready",
      sourceIngested: true,
      url: saved.signedUrl,
      storagePath: saved.path,
      message: "Compatible MP4 ready in your private Pilgrix workspace. Temporary Shotstack media has been deleted.",
    });
  }

  return json({
    status: "processing",
    sourceIngested,
    message: sourceStatus === "queued" || sourceStatus === "importing"
      ? "Transferring your source video securely for conversion…"
      : renditionStatus === "importing" || renditionStatus === "waiting"
        ? "Preparing the MP4 preview…"
        : "Converting the clip for browser playback…",
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    return json({
      error: cleanText(error?.message) || "Could not prepare a compatible video preview.",
    }, error?.status || 500);
  }
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (error) {
    return json({
      error: cleanText(error?.message) || "Could not check the preview conversion.",
    }, error?.status || 500);
  }
}
