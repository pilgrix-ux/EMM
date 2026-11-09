"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/3gpp",
]);

const DEFAULT_SETTINGS = {
  platform: "Instagram Reels",
  aspectRatio: "9:16",
  targetDuration: 30,
  visualStyle: "Premium and polished",
  captions: "Clean subtitles",
  voiceover: "No voiceover",
  music: "Keep original audio",
  language: "English",
};

function Icon({ name, size = 18 }) {
  const paths = {
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2.5" /><path d="m16 10 5-3v10l-5-3" /></>,
    text: <><path d="M4 6h16M12 6v13M8 19h8" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 19v1h16v-1" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    play: <path d="m8 5 11 7-11 7z" />,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    film: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Video file";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function safeFilename(name) {
  return String(name || "source-video.mp4")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "source-video.mp4";
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function CreateAdWorkspace() {
  const fileInputRef = useRef(null);
  const clientRef = useRef(null);
  const workspaceRef = useRef(null);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("Drive enquiries");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [planIncludesVideo, setPlanIncludesVideo] = useState(false);
  const [stage, setStage] = useState("input");
  const [plan, setPlan] = useState(null);
  const [selectedHook, setSelectedHook] = useState("");
  const [editedScript, setEditedScript] = useState("");
  const [editedCta, setEditedCta] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [renderMessage, setRenderMessage] = useState("Your video is being prepared.");
  const [finishedVideoUrl, setFinishedVideoUrl] = useState("");

  useEffect(() => {
    if (!selectedVideo) {
      setVideoUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(selectedVideo);
    setVideoUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedVideo]);

  useEffect(() => {
    return () => {
      if (finishedVideoUrl) URL.revokeObjectURL(finishedVideoUrl);
    };
  }, [finishedVideoUrl]);

  function getSupabase() {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  }

  async function getWorkspace() {
    if (!workspaceRef.current) {
      workspaceRef.current = (async () => {
        const response = await fetch("/api/workspace/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.visitorId) {
          throw new Error(result?.error || "Your private workspace could not start. Refresh and try again.");
        }
        return { visitorId: result.visitorId, client: getSupabase() };
      })().catch((error) => {
        workspaceRef.current = null;
        throw error;
      });
    }
    return workspaceRef.current;
  }

  async function saveProject(method, id, fields) {
    const response = await fetch("/api/workspace/projects", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fields }),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.project?.id) {
      const error = new Error(result?.error || "Your ad project could not be saved.");
      error.status = response.status;
      throw error;
    }
    return result.project;
  }

  async function trackWorkspaceEvent(eventName, project = null, properties = {}) {
    try {
      await fetch("/api/workspace/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, projectId: project, properties }),
        cache: "no-store",
      });
    } catch {
      // Analytics must never interrupt ad creation.
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("video/") || !ALLOWED_VIDEO_TYPES.has(file.type)) {
      setError("Choose an MP4, MOV, WebM, M4V or 3GPP video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError("This video is larger than 100 MB. Choose a smaller clip.");
      return;
    }

    setSelectedVideo(file);
    setSourcePath("");
    setError("");
    setNotice("");
    setFinishedVideoUrl("");
  }

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function handleGenerate(event) {
    event?.preventDefault();
    setError("");
    setNotice("");

    if (!description.trim()) {
      setError("Describe what you're advertising and what you want people to do.");
      return;
    }
    if (!selectedVideo && !sourcePath) {
      setError("Choose a video clip first.");
      return;
    }

    setBusy(true);
    try {
      const workspace = await getWorkspace();
      const savedSettings = { ...settings };
      const cleanProductName = productName.trim().slice(0, 120) || "My product or service";
      const title = cleanProductName === "My product or service"
        ? description.trim().slice(0, 70)
        : cleanProductName;
      const projectFields = {
        title: title || "Untitled ad",
        status: "plan_pending",
        product_name: cleanProductName,
        product_benefit: description.trim(),
        audience: audience.trim() || null,
        ad_goal: goal,
        platform: savedSettings.platform,
        aspect_ratio: savedSettings.aspectRatio,
        target_duration_seconds: Number(savedSettings.targetDuration),
        language: "en",
        creative_settings: savedSettings,
      };

      let activeProjectId = projectId;
      if (activeProjectId) {
        try {
          await saveProject("PATCH", activeProjectId, projectFields);
        } catch (caught) {
          if (caught?.status !== 404) throw caught;
          activeProjectId = "";
          setProjectId("");
        }
      }
      if (!activeProjectId) {
        const savedProject = await saveProject("POST", null, projectFields);
        activeProjectId = savedProject.id;
        setProjectId(activeProjectId);
        await trackWorkspaceEvent("project_created", activeProjectId, {
          platform: savedSettings.platform,
          goal,
        });
      }

      let activeSourcePath = sourcePath;
      let sourceVideoName = "";
      let didUploadVideo = false;
      if (selectedVideo) {
        sourceVideoName = selectedVideo.name;
        if (!activeSourcePath) {
          const grantResponse = await fetch("/api/workspace/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: activeProjectId,
              fileName: selectedVideo.name,
              contentType: selectedVideo.type,
              size: selectedVideo.size,
            }),
            cache: "no-store",
          });
          const grant = await grantResponse.json().catch(() => ({}));
          if (!grantResponse.ok || !grant.path || !grant.token) {
            throw new Error(grant?.error || "A private upload could not be prepared.");
          }

          const { error: uploadError } = await workspace.client.storage
            .from("emm-source-videos")
            .uploadToSignedUrl(grant.path, grant.token, selectedVideo, {
              contentType: selectedVideo.type,
              upsert: true,
              cacheControl: "3600",
            });
          if (uploadError) throw new Error(uploadError.message || "Your video could not be uploaded.");
          activeSourcePath = grant.path;
          didUploadVideo = true;
          setSourcePath(grant.path);
        }

        await saveProject("PATCH", activeProjectId, {
          source_video_path: activeSourcePath,
          source_video_name: sourceVideoName || selectedVideo.name,
          source_video_mime_type: selectedVideo.type,
          source_video_size_bytes: selectedVideo.size,
        });
        if (didUploadVideo) {
          await trackWorkspaceEvent("video_uploaded", activeProjectId, {
            contentType: selectedVideo.type,
            sizeBytes: selectedVideo.size,
          });
        }
      } else {
        activeSourcePath = "";
        setSourcePath("");
        await saveProject("PATCH", activeProjectId, {
          source_video_path: null,
          source_video_name: null,
          source_video_mime_type: null,
          source_video_size_bytes: null,
        });
      }

      const brief = {
        productName: cleanProductName,
        benefit: description.trim(),
        audience: audience.trim(),
        goal,
        platform: savedSettings.platform,
        aspectRatio: savedSettings.aspectRatio,
        targetDuration: Number(savedSettings.targetDuration),
        language: savedSettings.language,
        visualStyle: savedSettings.visualStyle,
        captions: savedSettings.captions,
        voiceover: savedSettings.voiceover,
        music: savedSettings.music,
      };

      const planResponse = await fetch("/api/ad-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId,
          brief,
          sourceVideoName: sourceVideoName || selectedVideo?.name || "Selected source video",
        }),
        cache: "no-store",
      });
      const planResult = await planResponse.json().catch(() => ({}));
      if (!planResponse.ok || !planResult?.plan) {
        throw new Error(planResult?.error || "AI planning could not finish. Please try again.");
      }

      const nextPlan = planResult.plan;
      await saveProject("PATCH", activeProjectId, {
        title: nextPlan.projectTitle || title || "Untitled ad",
        ad_plan: nextPlan,
        ad_plan_approved_at: null,
        status: "plan_ready",
        creative_settings: savedSettings,
      });

      await trackWorkspaceEvent("ad_plan_generated", activeProjectId, {
        platform: savedSettings.platform,
        durationSeconds: savedSettings.targetDuration,
      });
      setPlan(nextPlan);
      setSelectedHook(nextPlan.selectedHook || nextPlan.hooks?.[0] || "");
      setEditedScript(nextPlan.script || "");
      setEditedCta(nextPlan.callToAction || "");
      setPlanIncludesVideo(Boolean(activeSourcePath));
      setStage("plan");
      setNotice("Your ad plan is ready to review.");
    } catch (caught) {
      setError(caught?.message || "Something interrupted ad creation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function monitorRender() {
    setBusy(true);
    setError("");
    try {
      for (let attempt = 0; attempt < 45; attempt += 1) {
        await wait(4000);
        const response = await fetch("/api/render?projectId=" + encodeURIComponent(projectId), {
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || "Could not check the render status.");
        setRenderMessage(result.message || "Your video is being processed.");
        if (result.status === "failed") {
          setStage("plan");
          throw new Error(result.message || "The video render failed. You can retry it.");
        }
        if (result.ready || result.status === "done") {
          setStage("complete");
          setRenderMessage("Your finished video is ready.");
          setNotice("Rendering is complete. Load the preview or download your MP4.");
          return;
        }
      }
      setNotice("Your render is still processing. You can check again without starting a second render.");
    } catch (caught) {
      setError(caught?.message || "The render status could not be checked.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRender() {
    if (!projectId || !planIncludesVideo || !sourcePath) {
      setError("Add a source video before rendering. Your text-only ad plan is saved and ready for footage.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await getWorkspace();
      const cleanScript = editedScript.trim();
      const scriptWithSelectedHook = selectedHook
        && !cleanScript.toLowerCase().startsWith(selectedHook.trim().toLowerCase())
        ? selectedHook.trim() + "\n\n" + cleanScript
        : cleanScript;
      const approvedPlan = {
        ...plan,
        selectedHook,
        script: scriptWithSelectedHook,
        callToAction: editedCta,
      };
      const approvedSettings = { ...settings };

      await saveProject("PATCH", projectId, {
        ad_plan: approvedPlan,
        ad_plan_approved_at: new Date().toISOString(),
        status: "render_queued",
        creative_settings: approvedSettings,
      });
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "The rendering service could not start.");
      setStage("rendering");
      setRenderMessage(result.message || "Your video has been queued for rendering.");
      await monitorRender();
    } catch (caught) {
      setError(caught?.message || "The video render could not start.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckRender() {
    setError("");
    try {
      await getWorkspace();
      await monitorRender();
    } catch (caught) {
      setError(caught?.message || "Could not reconnect to your workspace.");
    }
  }

  async function handleLoadPreview() {
    setLoadingPreview(true);
    setError("");
    try {
      await getWorkspace();
      const response = await fetch(
        "/api/render?projectId=" + encodeURIComponent(projectId) + "&download=1",
        { cache: "no-store" }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.error || "The finished video could not be loaded.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The finished video file is empty.");
      const nextUrl = URL.createObjectURL(blob);
      setFinishedVideoUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return nextUrl;
      });
    } catch (caught) {
      setError(caught?.message || "Could not load the finished video.");
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleDownload() {
    if (!finishedVideoUrl) return;
    const anchor = document.createElement("a");
    anchor.href = finishedVideoUrl;
    anchor.download = safeFilename((productName || "pilgrix-ad") + ".mp4");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    void trackWorkspaceEvent("video_downloaded", projectId, {});
  }

  function startAnotherAd() {
    setProductName("");
    setDescription("");
    setAudience("");
    setGoal("Drive enquiries");
    setSettings(DEFAULT_SETTINGS);
    setSelectedVideo(null);
    setSourcePath("");
    setProjectId("");
    setPlanIncludesVideo(false);
    setPlan(null);
    setSelectedHook("");
    setEditedScript("");
    setEditedCta("");
    setFinishedVideoUrl("");
    setError("");
    setNotice("");
    setStage("input");
    setRenderMessage("Your video is being prepared.");
  }

  const isInputStage = stage === "input";
  const hasSourceVideo = planIncludesVideo && Boolean(sourcePath);

  return (
    <main className="creator-page">
      <div className="creator-shell">
        <header className="creator-topbar">
          <a className="creator-brand" href="/studio/create" aria-label="Pilgrix Ads Studio home">
            <span className="creator-brand-mark">P</span>
            <span className="creator-brand-wording">
              <strong>Pilgrix</strong>
              <small>ADS STUDIO</small>
            </span>
          </a>
          <div className="creator-top-actions">
            <span className="creator-private-label"><Icon name="lock" size={13} /> Private workspace</span>
            <a className="creator-project-link" href="/studio"><Icon name="folder" size={15} /> My projects</a>
          </div>
        </header>

        <section className="creator-heading">
          <span className="creator-eyebrow"><i /> YOUR AI ADVERTISING STUDIO</span>
          <h1>Let's make something <span>that sells.</span></h1>
          <p>Upload your footage. Pilgrix helps turn it into a polished ad plan you can review and refine.</p>
        </section>

        {isInputStage ? (
          <form className="creator-workspace" onSubmit={handleGenerate}>
            <section className="creator-start-panel">
              <div className="creator-upload-section">
                  <div className="creator-subheading">
                    <div><strong>Upload your footage</strong><small>Choose a clip or drag it into the upload area.</small></div>
                    <span>UP TO 100 MB</span>
                  </div>

                  {selectedVideo && videoUrl ? (
                    <div className="creator-video-preview">
                      <video src={videoUrl} controls playsInline preload="metadata" />
                      <div className="creator-file-row">
                        <span className="creator-file-icon"><Icon name="film" /></span>
                        <span className="creator-file-copy"><strong>{selectedVideo.name}</strong><small>{formatBytes(selectedVideo.size)} · Ready to upload</small></span>
                        <button className="creator-remove-file" type="button" onClick={() => { setSelectedVideo(null); setSourcePath(""); }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="creator-dropzone"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("video/") || !ALLOWED_VIDEO_TYPES.has(file.type)) {
                          setError("Choose an MP4, MOV, WebM, M4V or 3GPP video.");
                        } else if (file.size > MAX_VIDEO_BYTES) {
                          setError("This video is larger than 100 MB. Choose a smaller clip.");
                        } else {
                          setSelectedVideo(file);
                          setSourcePath("");
                          setFinishedVideoUrl("");
                          setError("");
                          setNotice("");
                        }
                      }}
                    >
                      <span className="creator-upload-symbol"><Icon name="upload" size={23} /></span>
                      <strong>Drop your video here</strong>
                      <small>MP4, MOV, WebM or M4V · Up to 100 MB</small>
                      <span className="creator-browse-label">Browse files <Icon name="arrow" size={14} /></span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    className="creator-hidden-input"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/3gpp"
                    onChange={handleFileChange}
                  />
                </div>
              <div className="creator-brief-section">
                <div className="creator-subheading">
                  <div><strong>Tell us about the ad</strong><small>A few clear details help the AI make a stronger plan.</small></div>
                  <span>REQUIRED</span>
                </div>
                <label className="creator-field">
                  <span>Product or business name <i>OPTIONAL</i></span>
                  <input
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="e.g. Nova Streetwear"
                    maxLength={120}
                  />
                </label>
                <label className="creator-field">
                  <span>Describe what you want to advertise <b>*</b></span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="e.g. Create a stylish ad for my new clothing collection. Show the quality and look of the pieces, make it feel premium, and encourage people to send a message to order."
                    rows={4}
                    maxLength={3000}
                    required
                  />
                  <small className="creator-character-count">{description.length}/3000</small>
                </label>
                <label className="creator-field">
                  <span>Who should this ad reach? <i>OPTIONAL</i></span>
                  <input
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="e.g. Young adults who love modern streetwear"
                    maxLength={180}
                  />
                </label>
              </div>

              <div className="creator-settings-section">
                <div className="creator-subheading">
                  <div><strong>Ad preferences</strong><small>Choose a few defaults. You can keep everything as it is.</small></div>
                  <span>QUICK SETTINGS</span>
                </div>
                <div className="creator-settings-grid">
                  <label className="creator-field">
                    <span>Goal</span>
                    <select value={goal} onChange={(event) => setGoal(event.target.value)}>
                      <option>Drive enquiries</option>
                      <option>Promote an offer</option>
                      <option>Build awareness</option>
                      <option>Get website visits</option>
                      <option>Explain a product</option>
                    </select>
                  </label>
                  <label className="creator-field">
                    <span>Platform</span>
                    <select
                      value={settings.platform}
                      onChange={(event) => {
                        const platform = event.target.value;
                        updateSetting("platform", platform);
                        updateSetting("aspectRatio", platform === "YouTube" ? "16:9" : "9:16");
                      }}
                    >
                      <option>Instagram Reels</option>
                      <option>TikTok</option>
                      <option>YouTube Shorts</option>
                      <option>YouTube</option>
                      <option>Facebook</option>
                    </select>
                  </label>
                  <label className="creator-field">
                    <span>Video length</span>
                    <select value={settings.targetDuration} onChange={(event) => updateSetting("targetDuration", Number(event.target.value))}>
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </label>
                  <label className="creator-field">
                    <span>Creative style</span>
                    <select value={settings.visualStyle} onChange={(event) => updateSetting("visualStyle", event.target.value)}>
                      <option>Premium and polished</option>
                      <option>Energetic and bold</option>
                      <option>Clean and minimal</option>
                      <option>Playful and friendly</option>
                      <option>Cinematic</option>
                    </select>
                  </label>
                </div>
                <details className="creator-advanced">
                  <summary>More creative settings <span>Optional</span></summary>
                  <div className="creator-settings-grid creator-settings-grid-advanced">
                    <label className="creator-field">
                      <span>Captions</span>
                      <select value={settings.captions} onChange={(event) => updateSetting("captions", event.target.value)}>
                        <option>No captions</option>
                        <option>Clean subtitles</option>
                        <option>Animated captions</option>
                      </select>
                    </label>
                    <label className="creator-field">
                      <span>Voiceover</span>
                      <select value={settings.voiceover} onChange={(event) => updateSetting("voiceover", event.target.value)}>
                        <option>No voiceover</option>
                        <option>Warm conversational voiceover</option>
                        <option>Energetic voiceover</option>
                      </select>
                    </label>
                    <label className="creator-field">
                      <span>Original audio</span>
                      <select value={settings.music} onChange={(event) => updateSetting("music", event.target.value)}>
                        <option>Keep original audio</option>
                        <option>Lower original audio</option>
                        <option>Mute original audio</option>
                      </select>
                    </label>
                  </div>
                  {settings.voiceover !== "No voiceover" && (
                    <p className="creator-voice-note">Cloud voiceover currently supports English and French. Turn it off to use the original audio and captions instead.</p>
                  )}
                </details>
              </div>

              {error && <p className="creator-error" role="alert">{error}</p>}
              {notice && <p className="creator-notice" role="status">{notice}</p>}

              <div className="creator-submit-row">
                <div className="creator-privacy-note"><Icon name="lock" size={14} /><span>No sign-up form. Your private guest workspace is saved on this browser.</span></div>
                <button className="creator-primary-button" type="submit" disabled={busy}>
                  {busy ? <><span className="creator-spinner" /> Preparing your ad plan…</> : <>Build my ad plan <Icon name="arrow" size={17} /></>}
                </button>
              </div>
              <p className="creator-honesty-note">AI creates the script and scene plan from your description. It does not visually analyse your uploaded footage yet.</p>
            </section>
          </form>
        ) : stage === "plan" ? (
          <section className="creator-result-layout">
            <div className="creator-result-header">
              <button className="creator-back-button" type="button" onClick={() => { setStage("input"); setError(""); setNotice(""); }}><Icon name="back" size={16} /> Back to edit</button>
              <span className="creator-success-chip"><Icon name="check" size={13} /> PLAN READY</span>
            </div>
            <section className="creator-result-panel">
              <div className="creator-result-intro">
                <span className="creator-step-label">02 / REVIEW YOUR CREATIVE</span>
                <h2>Your ad is taking shape.</h2>
                <p>Choose the hook you like, refine the script and approve it when it feels right.</p>
              </div>
              <div className="creator-plan-block">
                <div className="creator-block-heading"><span>01</span><div><strong>Opening hook</strong><small>Choose the first line viewers will see or hear.</small></div></div>
                <div className="creator-hook-list">
                  {(plan?.hooks || []).map((hook, index) => (
                    <label className={"creator-hook-option" + (selectedHook === hook ? " is-selected" : "")} key={hook + index}>
                      <input type="radio" name="selected-hook" value={hook} checked={selectedHook === hook} onChange={() => setSelectedHook(hook)} />
                      <span className="creator-hook-radio" />
                      <span>{hook}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="creator-plan-block">
                <div className="creator-block-heading"><span>02</span><div><strong>Ad script</strong><small>Edit the narration and key message before rendering.</small></div></div>
                <label className="creator-field">
                  <textarea value={editedScript} onChange={(event) => setEditedScript(event.target.value)} rows={6} maxLength={5000} />
                </label>
                <label className="creator-field creator-cta-field">
                  <span>Final call to action</span>
                  <input value={editedCta} onChange={(event) => setEditedCta(event.target.value)} maxLength={240} />
                </label>
              </div>
              <div className="creator-plan-block">
                <div className="creator-block-heading"><span>03</span><div><strong>Scene breakdown</strong><small>Suggested structure for the finished ad.</small></div></div>
                <div className="creator-scene-list">
                  {(plan?.scenes || []).map((scene, index) => (
                    <article className="creator-scene" key={scene.time + "-" + index}>
                      <span className="creator-scene-number">{String(index + 1).padStart(2, "0")}</span>
                      <div className="creator-scene-content">
                        <div className="creator-scene-top"><strong>{scene.time || "Scene " + (index + 1)}</strong><span>SCENE {index + 1}</span></div>
                        <p>{scene.visualDirection}</p>
                        {scene.onScreenText && <div className="creator-scene-overlay">ON-SCREEN TEXT <strong>{scene.onScreenText}</strong></div>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              {hasSourceVideo ? (
                <div className="creator-approval-bar">
                  <div><strong>Ready to render?</strong><small>Your uploaded footage and approved plan will be assembled into an MP4.</small></div>
                  <button className="creator-primary-button" type="button" onClick={handleRender} disabled={busy}>
                    {busy ? <><span className="creator-spinner" /> Sending to renderer…</> : <>Render final video <Icon name="arrow" size={17} /></>}
                  </button>
                </div>
              ) : (
                <div className="creator-idea-only-note">
                  <span className="creator-idea-icon"><Icon name="spark" size={18} /></span>
                  <div><strong>Your ad plan is ready. Video rendering needs footage.</strong><p>Text-to-video generation is not connected yet. Add a source clip to turn this plan into a finished MP4.</p></div>
                  <button type="button" onClick={() => { setStage("input"); setError(""); }}>Add a video</button>
                </div>
              )}
              {error && <p className="creator-error" role="alert">{error}</p>}
            </section>
          </section>
        ) : stage === "rendering" ? (
          <section className="creator-progress-panel">
            <span className="creator-progress-icon"><Icon name="film" size={30} /></span>
            <span className="creator-step-label">03 / VIDEO RENDERING</span>
            <h2>Your ad is being made.</h2>
            <p>{renderMessage}</p>
            <div className="creator-progress-track"><span /></div>
            <small>Rendering happens in the cloud. This screen checks the real job status; no estimated percentage is shown.</small>
            {error && <p className="creator-error" role="alert">{error}</p>}
            {!busy && <button className="creator-primary-button" type="button" onClick={handleCheckRender}>Check render status <Icon name="refresh" size={16} /></button>}
          </section>
        ) : (
          <section className="creator-result-layout">
            <div className="creator-result-header">
              <span className="creator-success-chip"><Icon name="check" size={13} /> RENDER COMPLETE</span>
              <a className="creator-back-button" href="/studio"><Icon name="folder" size={15} /> My projects</a>
            </div>
            <section className="creator-complete-panel">
              <span className="creator-complete-icon"><Icon name="check" size={27} /></span>
              <span className="creator-step-label">YOUR AD IS READY</span>
              <h2>That's a wrap.</h2>
              <p>Your MP4 has finished rendering. Load the finished preview or save it to your device.</p>
              {finishedVideoUrl ? (
                <video className="creator-finished-video" src={finishedVideoUrl} controls playsInline />
              ) : (
                <div className="creator-preview-placeholder"><Icon name="play" size={25} /><strong>Finished video</strong><small>Load your MP4 to preview it here.</small></div>
              )}
              <div className="creator-complete-actions">
                {finishedVideoUrl ? (
                  <button className="creator-primary-button" type="button" onClick={handleDownload}><Icon name="download" size={16} /> Download MP4</button>
                ) : (
                  <button className="creator-primary-button" type="button" onClick={handleLoadPreview} disabled={loadingPreview}>
                    {loadingPreview ? <><span className="creator-spinner" /> Loading preview…</> : <>Load video preview <Icon name="play" size={16} /></>}
                  </button>
                )}
                <button className="creator-secondary-button" type="button" onClick={startAnotherAd}>Create another ad</button>
              </div>
              {error && <p className="creator-error" role="alert">{error}</p>}
            </section>
          </section>
        )}

        <footer className="creator-footer">
          <span>PILGRIX ADS STUDIO</span>
          <span>YOUR IDEA. YOUR FOOTAGE. YOUR CREATIVE CONTROL.</span>
        </footer>
      </div>
    </main>
  );
}
