export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 4000;
const PROJECT_FIELDS = [
  "id",
  "user_id",
  "source_video_path",
  "source_video_name",
  "creative_settings",
  "ad_plan",
  "target_duration_seconds",
  "aspect_ratio",
  "product_name",
].join(",");

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function cleanText(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function getProviderConfig() {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  const environment = process.env.SHOTSTACK_ENV === "v1" ? "v1" : "stage";
  if (!apiKey) {
    throw new ApiError(
      "Cloud video rendering is not configured. Add SHOTSTACK_API_KEY to the Vercel environment variables, then redeploy.",
      503
    );
  }
  return {
    apiKey,
    environment,
    editBaseUrl: `https://api.shotstack.io/edit/${environment}`,
    serveBaseUrl: `https://api.shotstack.io/serve/${environment}`,
  };
}

async function readResponse(response) {
  return response.json().catch(() => ({}));
}

async function authorize(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !publishableKey) {
    throw new ApiError("The EMM Supabase connection is not configured.", 503);
  }
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError("Sign in to your EMM workspace before rendering a video.", 401);
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: authorization },
    cache: "no-store",
  });
  const user = await readResponse(response);
  if (!response.ok || !user?.id) {
    throw new ApiError("Your EMM session has expired. Sign in again and retry.", 401);
  }

  return { supabaseUrl, publishableKey, authorization, user };
}

async function getProject(projectId, auth) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId || "")) {
    throw new ApiError("A valid saved project is required before rendering.", 400);
  }

  const query = new URLSearchParams({
    id: `eq.${projectId}`,
    select: PROJECT_FIELDS,
  });
  const response = await fetch(`${auth.supabaseUrl}/rest/v1/ad_projects?${query}`, {
    headers: {
      apikey: auth.publishableKey,
      Authorization: auth.authorization,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const rows = await readResponse(response);
  if (!response.ok) {
    throw new ApiError(
      cleanText(rows?.message || rows?.error, 260) || "EMM could not load this saved project.",
      502
    );
  }

  const project = Array.isArray(rows) ? rows[0] : null;
  if (!project || project.user_id !== auth.user.id) {
    throw new ApiError("This saved project could not be found in your workspace.", 404);
  }
  if (!project.source_video_path || !project.ad_plan) {
    throw new ApiError("Save an approved ad plan with its source video before rendering.", 400);
  }
  if (!project.source_video_path.startsWith(auth.user.id + "/")) {
    throw new ApiError("The source video does not belong to this workspace.", 403);
  }
  return project;
}

async function updateCreativeSettings(project, auth, patch) {
  const settings = project.creative_settings && typeof project.creative_settings === "object"
    ? project.creative_settings
    : {};
  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/ad_projects?id=eq.${project.id}&user_id=eq.${auth.user.id}`,
    {
      method: "PATCH",
      headers: {
        apikey: auth.publishableKey,
        Authorization: auth.authorization,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        creative_settings: { ...settings, ...patch },
      }),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const detail = await readResponse(response);
    throw new ApiError(
      cleanText(detail?.message || detail?.error, 240) || "EMM could not save the render status to this project.",
      502
    );
  }
}

async function createSourceUrl(project, auth) {
  const encodedPath = project.source_video_path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const response = await fetch(
    `${auth.supabaseUrl}/storage/v1/object/sign/emm-source-videos/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: auth.publishableKey,
        Authorization: auth.authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 86400 }),
      cache: "no-store",
    }
  );
  const result = await readResponse(response);
  if (!response.ok || !result?.signedURL) {
    throw new ApiError(
      cleanText(result?.message || result?.error, 240) || "EMM could not prepare the private source video for rendering.",
      502
    );
  }

  const signedPath = String(result.signedURL);
  if (/^https:\/\//i.test(signedPath)) return signedPath;
  if (signedPath.startsWith("/storage/v1/")) return auth.supabaseUrl + signedPath;
  return auth.supabaseUrl + "/storage/v1" + (signedPath.startsWith("/") ? signedPath : "/" + signedPath);
}

function buildTextAsset(text, size = 48) {
  return {
    type: "text",
    text: cleanText(text, 180),
    width: 920,
    height: 210,
    font: {
      family: "Open Sans",
      color: "#ffffff",
      size,
      weight: 700,
      lineHeight: 1.05,
    },
    background: {
      color: "#111813",
      opacity: 0.68,
      padding: 18,
      borderRadius: 14,
      wrap: true,
    },
    alignment: { horizontal: "center", vertical: "center" },
  };
}

function buildEdit(project, sourceUrl, environment) {
  const brief = project.creative_settings || {};
  const plan = project.ad_plan || {};
  const duration = Math.min(60, Math.max(10, Number(project.target_duration_seconds) || 30));
  const aspectRatio = ["9:16", "16:9", "1:1", "4:5", "4:3"].includes(project.aspect_ratio)
    ? project.aspect_ratio
    : "9:16";
  const voiceoverMode = cleanText(brief.voiceover, 80);
  const wantsVoiceover = voiceoverMode && voiceoverMode !== "No voiceover";
  const voiceoverText = cleanText(
    plan.script || (Array.isArray(plan.scenes) ? plan.scenes.map((scene) => scene.voiceover).filter(Boolean).join(" ") : ""),
    MAX_TEXT
  );
  const audioMode = cleanText(brief.music, 80) || "Keep original audio";
  let sourceVolume = audioMode === "Mute original audio" ? 0 : audioMode === "Lower original audio" ? 0.35 : 1;
  if (wantsVoiceover && sourceVolume > 0) sourceVolume = Math.min(sourceVolume, 0.2);

  const tracks = [];
  const captionsMode = cleanText(brief.captions, 80);
  const includeCaptions = captionsMode && captionsMode !== "No captions";
  if (includeCaptions) {
    tracks.push({
      clips: [{
        asset: {
          type: "rich-caption",
          src: wantsVoiceover && voiceoverText ? "alias://emm-voiceover" : "alias://emm-source",
          font: {
            family: "Open Sans",
            size: 46,
            weight: "800",
            color: "#ffffff",
            opacity: 1,
          },
          background: {
            color: "#111813",
            opacity: 0.76,
            borderRadius: 10,
            wrap: true,
          },
          padding: 18,
          align: { horizontal: "center", vertical: "middle" },
          animation: { style: captionsMode === "Animated captions" ? "highlight" : "none" },
        },
        start: 0,
        length: "end",
      }],
    });
  }

  const sceneClips = [];
  const scenes = Array.isArray(plan.scenes) ? plan.scenes.slice(0, 8) : [];
  const sceneSlot = duration / Math.max(1, scenes.length);
  scenes.forEach((scene, index) => {
    const line = cleanText(scene?.onScreenText, 180);
    if (!line) return;
    sceneClips.push({
      asset: buildTextAsset(line, 44),
      start: Number((index * sceneSlot).toFixed(2)),
      length: Number(sceneSlot.toFixed(2)),
      position: "top",
      offset: { y: 0.12 },
    });
  });

  const callToAction = cleanText(plan.callToAction, 180);
  if (callToAction) {
    const ctaLength = Math.min(4, duration);
    sceneClips.push({
      asset: buildTextAsset(callToAction, 46),
      start: Number((duration - ctaLength).toFixed(2)),
      length: Number(ctaLength.toFixed(2)),
      position: "bottom",
      offset: { y: 0.1 },
    });
  }
  if (sceneClips.length) tracks.push({ clips: sceneClips });

  if (wantsVoiceover && voiceoverText) {
    const voice = voiceoverMode === "Energetic voiceover"
      ? "Charlie"
      : voiceoverMode === "Warm conversational voiceover"
        ? "Laura"
        : "Rachel";
    tracks.push({
      clips: [{
        alias: "emm-voiceover",
        asset: {
          type: "audio",
          prompt: voiceoverText,
          model: "elevenlabs-multilingual-v2",
          options: { voice },
        },
        start: 0,
        length: "auto",
        volume: 1,
      }],
    });
  }

  tracks.push({
    clips: [{
      alias: "emm-source",
      asset: {
        type: "video",
        src: sourceUrl,
        transcode: true,
        volume: sourceVolume,
      },
      start: 0,
      length: duration,
      fit: "cover",
    }],
  });

  return {
    timeline: { background: "#111813", tracks },
    output: {
      format: "mp4",
      resolution: "hd",
      aspectRatio,
      fps: 30,
      quality: "high",
      range: { start: 0, length: duration },
      poster: { capture: 1 },
    },
  };
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
    const detail = cleanText(data?.response?.message || data?.message || data?.error, 280);
    throw new ApiError(detail || "The video rendering service rejected the request. Please check your render settings and try again.", 502);
  }
  return data;
}

function renderAttributes(payload) {
  return payload?.response?.attributes
    || payload?.response
    || payload?.data?.attributes
    || payload?.attributes
    || {};
}

function friendlyStatus(status) {
  const labels = {
    queued: "Your video is queued for rendering.",
    fetching: "Preparing your source video.",
    preprocessing: "Converting your video for compatibility.",
    generating: "Generating the voiceover and captions.",
    rendering: "Composing your final video.",
    saving: "Saving your MP4.",
    done: "Your video is ready.",
    failed: "The render could not be completed.",
  };
  return labels[status] || "Your video render is being processed.";
}

async function getRenderStatus(renderId, provider) {
  const result = await shotstackFetch(
    `${provider.editBaseUrl}/render/${encodeURIComponent(renderId)}?data=false`,
    provider.apiKey
  );
  const attributes = renderAttributes(result);
  const status = cleanText(attributes.status, 40).toLowerCase();
  if (!status) throw new ApiError("The rendering service returned an unreadable status.", 502);
  return {
    status,
    message: cleanText(attributes.error, 300) || friendlyStatus(status),
    owner: cleanText(attributes.owner, 80),
    temporaryUrl: cleanText(attributes.url, 2000),
    credits: Number.isFinite(Number(attributes.credits)) ? Number(attributes.credits) : null,
  };
}

async function getHostedVideoUrl(renderId, status, provider) {
  try {
    const result = await shotstackFetch(
      `${provider.serveBaseUrl}/assets/render/${encodeURIComponent(renderId)}`,
      provider.apiKey
    );
    const assets = Array.isArray(result?.data) ? result.data : [];
    const match = assets.find((item) => {
      const attributes = item?.attributes || {};
      return (attributes.filename || "").toLowerCase().endsWith(".mp4")
        || (attributes.url || "").toLowerCase().includes(".mp4");
    }) || assets[0];
    const url = cleanText(match?.attributes?.url, 2000);
    if (url) {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && parsed.hostname === "cdn.shotstack.io") return url;
    }
  } catch {
    // The temporary render URL is still usable while the permanent CDN copy becomes available.
  }

  if (status.temporaryUrl) {
    const parsed = new URL(status.temporaryUrl);
    if (parsed.protocol === "https:" && parsed.hostname.endsWith("shotstack.io")) {
      return status.temporaryUrl;
    }
  }
  throw new ApiError("The MP4 is ready, but the video host has not finished publishing it. Check again in a few seconds.", 409);
}

async function handlePost(request) {
  const provider = getProviderConfig();
  const auth = await authorize(request);
  const body = await request.json().catch(() => ({}));
  const project = await getProject(body?.projectId, auth);
  const sourceUrl = await createSourceUrl(project, auth);
  const edit = buildEdit(project, sourceUrl, provider.environment);

  const queued = await shotstackFetch(`${provider.editBaseUrl}/render`, provider.apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(edit),
  });
  const renderId = cleanText(queued?.response?.id || queued?.id, 80);
  if (!renderId) throw new ApiError("The rendering service did not return a render ID.", 502);

  await updateCreativeSettings(project, auth, {
    shotstackRenderId: renderId,
    shotstackRenderStatus: "queued",
    shotstackRenderEnvironment: provider.environment,
    shotstackRenderStartedAt: new Date().toISOString(),
    shotstackRenderCompletedAt: null,
  });

  return json({
    renderId,
    status: "queued",
    message: "Your video has been sent to the cloud renderer.",
    environment: provider.environment,
  }, 202);
}

async function handleGet(request) {
  const provider = getProviderConfig();
  const auth = await authorize(request);
  const url = new URL(request.url);
  const project = await getProject(url.searchParams.get("projectId"), auth);
  const settings = project.creative_settings && typeof project.creative_settings === "object"
    ? project.creative_settings
    : {};
  const renderId = cleanText(settings.shotstackRenderId, 80);
  if (!renderId) throw new ApiError("No video render has been started for this project yet.", 404);

  const status = await getRenderStatus(renderId, provider);
  const patch = { shotstackRenderStatus: status.status };
  if (status.status === "done") {
    patch.shotstackRenderCompletedAt = settings.shotstackRenderCompletedAt || new Date().toISOString();
    if (status.owner) patch.shotstackRenderOwner = status.owner;
    if (status.credits !== null) patch.shotstackRenderCredits = status.credits;
  }
  if (status.status === "failed" && status.message) patch.shotstackRenderError = status.message;
  await updateCreativeSettings(project, auth, patch);

  if (url.searchParams.get("download") === "1") {
    if (status.status !== "done") {
      throw new ApiError("The MP4 is not ready to download yet. Check the render status again shortly.", 409);
    }
    const hostedUrl = await getHostedVideoUrl(renderId, status, provider);
    const mediaResponse = await fetch(hostedUrl, { cache: "no-store" });
    if (!mediaResponse.ok || !mediaResponse.body) {
      throw new ApiError("The finished MP4 could not be downloaded from the video host. Please try again.", 502);
    }

    const safeTitle = cleanText(project.product_name || project.source_video_name || "emm-ad", 80)
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "emm-ad";
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${safeTitle}.mp4"`,
      "Cache-Control": "private, no-store",
    });
    const contentLength = mediaResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    return new Response(mediaResponse.body, { status: 200, headers });
  }

  return json({
    renderId,
    status: status.status,
    message: status.status === "failed" ? status.message : friendlyStatus(status.status),
    ready: status.status === "done",
    credits: status.credits,
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    return json({ error: cleanText(error?.message, 360) || "Video rendering failed unexpectedly." }, error?.status || 500);
  }
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (error) {
    return json({ error: cleanText(error?.message, 360) || "Could not check the video render." }, error?.status || 500);
  }
}
