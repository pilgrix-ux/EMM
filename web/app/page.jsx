"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { logAuthDiagnostic, verifySignupOtp } from "../lib/supabase/verify-signup-otp";

const initialBrief = {
  productName: "",
  benefit: "",
  audience: "",
  goal: "Get more enquiries",
  platform: "Instagram Reels",
  aspectRatio: "9:16",
  targetDuration: "30",
  language: "English",
  visualStyle: "Premium and polished",
  captions: "Clean subtitles",
  voiceover: "No voiceover",
  music: "Keep original audio",
};

function Icon({ name, size = 18, strokeWidth = 1.7, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M9 20v-6h6v6" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    play: <path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
    sliders: <><path d="M4 7h7M15 7h5M4 17h3M11 17h9" /><circle cx="13" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    edit: <><path d="m15 5 4 4" /><path d="m4 20 4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
    eye: <><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.6" /></>,
    "eye-off": <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.2 0 9.5 6 9.5 6a14.7 14.7 0 0 1-3 3.6" /><path d="M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.3 6 9.5 6c1 0 1.9-.2 2.7-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  };

  return <svg {...common}>{paths[name] || paths.info}</svg>;
}

export default function HomePage() {
  const fileInputRef = useRef(null);
  const videoSectionRef = useRef(null);
  const briefSectionRef = useRef(null);
  const videoElementRef = useRef(null);
  const videoObjectUrlRef = useRef("");
  const previewAutoAttemptRef = useRef(false);
  const builderMainRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDragActive, setVideoDragActive] = useState(false);
  const [brief, setBrief] = useState(initialBrief);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [formError, setFormError] = useState("");
  const [videoPreviewError, setVideoPreviewError] = useState("");
  const [previewErrorCode, setPreviewErrorCode] = useState(null);
  const [compatiblePreviewUrl, setCompatiblePreviewUrl] = useState("");
  const [compatiblePreviewPath, setCompatiblePreviewPath] = useState("");
  const [previewConverting, setPreviewConverting] = useState(false);
  const [previewConversionMessage, setPreviewConversionMessage] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [adPlan, setAdPlan] = useState(null);
  const [planApproved, setPlanApproved] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("sign-in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authOtpStep, setAuthOtpStep] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedProjectId, setSavedProjectId] = useState("");
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [renderId, setRenderId] = useState("");
  const [renderStatus, setRenderStatus] = useState("");
  const [renderMessage, setRenderMessage] = useState("");
  const [renderReady, setRenderReady] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (reviewOpen) {
      builderMainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [builderStep, reviewOpen]);

  useEffect(() => {
    const configured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
    setSupabaseConfigured(configured);
    if (!configured) return undefined;

    let client;
    try {
      client = createClient();
      setSupabase(client);
    } catch (error) {
      setAuthMessage(error.message);
      return undefined;
    }

    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setSavedProjects([]);
      return undefined;
    }
    let active = true;
    setProjectsLoading(true);
    supabase.from("ad_projects")
      .select("id, title, status, source_video_name, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setAuthMessage(error.message); return; }
        setSavedProjects(data || []);
      })
      .finally(() => { if (active) setProjectsLoading(false); });
    return () => { active = false; };
  }, [supabase, user]);
  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!supabase) {
      setAuthMessage("Supabase is not configured. Add the project URL and publishable key in Vercel.");
      return;
    }

    setAuthBusy(true);
    setAuthMessage("");
    try {
      if (authOtpStep) {
        const token = authOtp.trim();
        if (!/^\d{6}$/.test(token)) {
          throw new Error("Enter the 6-digit code from your email.");
        }
        const normalizedEmail = authEmail.trim().toLowerCase();
        const { data, error } = await verifySignupOtp({ supabase, email: normalizedEmail, token });
        if (error) throw error;

        const verifiedUser = data.user || data.session?.user || null;
        setUser(verifiedUser);
        setAuthOpen(false);
        setAuthPassword("");
        setAuthOtp("");
        setAuthOtpStep(false);
        if (!reviewOpen) {
          window.location.replace("/studio");
        }
        return;
      }

      if (authMode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        });
        if (error) throw error;

        if (data.session) {
          setUser(data.user);
          setAuthOpen(false);
          setAuthPassword("");
          if (!reviewOpen) {
            window.location.replace("/studio");
          }
        } else {
          setAuthPassword("");
          setAuthOtpStep(false);
          setAuthOtp("");
          window.location.assign("/verify?email=" + encodeURIComponent(authEmail.trim().toLowerCase()));
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        });
        if (error) {
          if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message || "")) {
            setAuthOtpStep(true);
            setAuthOtp("");
            setAuthMessage("Your email address has not been verified. Resend the code below, then enter it here.");
            return;
          }
          throw error;
        }
        setUser(data.user);
        setAuthOpen(false);
        setAuthPassword("");
        if (!reviewOpen) {
          window.location.replace("/studio");
        }
      }
    } catch (error) {
      const wasVerifyingOtp = authOtpStep;
      logAuthDiagnostic(wasVerifyingOtp ? "signup OTP form failed" : "email sign-in or signup form failed", error);
      setAuthMessage(wasVerifyingOtp
        ? "We couldn't verify your email. Please try again or request a new code."
        : "We couldn't complete that request. Please check your details and try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleResendOtp() {
    if (!supabase || !authEmail.trim()) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: authEmail.trim().toLowerCase(),
      });
      if (error) throw error;
      setAuthOtp("");
      setAuthMessage("A new 6-digit verification code has been sent to " + authEmail.trim().toLowerCase() + ". Use the newest email only; each resend invalidates the previous code.");
    } catch (error) {
      logAuthDiagnostic("signup verification code resend failed", error, { flow: "signup-resend" });
      setAuthMessage("We couldn't send a new verification code. Please try again shortly.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) { setAuthMessage(error.message); return; }
    setUser(null);
    setSavedProjectId("");
    setSaveMessage("");
  }

  async function saveDraft() {
    if (!supabaseConfigured || !supabase) {
      setSaveMessage("Supabase is not connected to this deployment yet. Add the public URL and publishable key in Vercel.");
      return null;
    }
    if (!user) {
      setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
      setAuthMessage("Sign in or create an account to save this ad and its source video privately.");
      setAuthOpen(true);
      return null;
    }
    if (videoFile && videoFile.size > 104857600) {
      setSaveMessage("This video is too large for the current 100 MB upload limit. Choose a smaller clip.");
      return null;
    }
    if ((!videoFile && !savedProjectId) || !brief.productName.trim() || !brief.benefit.trim()) {
      setSaveMessage("Choose a source video and complete the required product details before saving.");
      return null;
    }

    setSaving(true);
    setSaveMessage("");
    const projectFields = {
      title: brief.productName.trim(),
      product_name: brief.productName.trim(),
      product_benefit: brief.benefit.trim(),
      audience: brief.audience.trim() || null,
      ad_goal: brief.goal.trim() || null,
      platform: brief.platform,
      aspect_ratio: brief.aspectRatio,
      target_duration_seconds: Number(brief.targetDuration),
      language: brief.language,
      creative_settings: {
        visualStyle: brief.visualStyle,
        captions: brief.captions,
        voiceover: brief.voiceover,
        music: brief.music,
      },
      ad_plan: adPlan,
      ad_plan_approved_at: planApproved ? new Date().toISOString() : null,
      status: adPlan ? "plan_ready" : "draft",
    };

    try {
      if (savedProjectId) {
        const { error } = await supabase.from("ad_projects")
          .update(projectFields)
          .eq("id", savedProjectId)
          .eq("user_id", user.id);
        if (error) throw error;
        setSavedProjects((current) => current.map((project) => project.id === savedProjectId
          ? { ...project, title: brief.productName.trim(), status: adPlan ? "plan_ready" : "draft" }
          : project));
        setSaveMessage("Updated your Pilgrix project.");
        return savedProjectId;
      }

      if (!videoFile) {
        setSaveMessage("Choose your source video before saving this project.");
        return null;
      }

      const projectId = crypto.randomUUID();
      const safeName = videoFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "source-video";
      const storagePath = user.id + "/" + projectId + "/" + safeName;
      const { error: uploadError } = await supabase.storage.from("emm-source-videos").upload(storagePath, videoFile, {
        cacheControl: "3600",
        contentType: videoFile.type || "application/octet-stream",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase.from("ad_projects").insert({
        id: projectId,
        user_id: user.id,
        ...projectFields,
        source_video_path: storagePath,
        source_video_name: videoFile.name,
        source_video_mime_type: videoFile.type || null,
        source_video_size_bytes: videoFile.size,
      }).select("id").single();

      if (insertError) {
        await supabase.storage.from("emm-source-videos").remove([storagePath]);
        throw insertError;
      }

      setSavedProjectId(data.id);
      setSavedProjects((current) => [{
        id: data.id,
        title: brief.productName.trim(),
        status: adPlan ? "plan_ready" : "draft",
        source_video_name: videoFile.name,
        created_at: new Date().toISOString(),
      }, ...current].slice(0, 6));
      setSaveMessage("Saved securely to your Pilgrix workspace.");
      return data.id;
    } catch (error) {
      setSaveMessage(error.message || "Could not save this project. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => () => {
    const activeUrl = videoObjectUrlRef.current;
    videoObjectUrlRef.current = "";
    if (activeUrl) URL.revokeObjectURL(activeUrl);
  }, []);

  function openVideoPicker() {
    fileInputRef.current?.click();
  }

  function processVideoFile(file) {
    if (!file) return;

    const supportedVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|3gp)$/i.test(file.name);
    if (!supportedVideo) {
      setFormError("Choose a supported video file to continue.");
      return;
    }

    try {
      const nextUrl = URL.createObjectURL(file);
      const previousUrl = videoObjectUrlRef.current;

      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.removeAttribute("src");
        videoElementRef.current.load();
      }

      videoObjectUrlRef.current = nextUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      setVideoFile(file);
      setVideoUrl(nextUrl);
      setVideoPreviewError("");
      setPreviewErrorCode(null);
      setCompatiblePreviewUrl("");
      if (compatiblePreviewPath && supabase) {
        void supabase.storage.from("emm-source-videos").remove([compatiblePreviewPath]);
      }
      setCompatiblePreviewPath("");
      setPreviewConversionMessage("");
      previewAutoAttemptRef.current = false;
      setSavedProjectId("");
      setRenderId("");
      setRenderStatus("");
      setRenderMessage("");
      setRenderReady(false);
      setFormError("");
      setGenerationMessage("");
    } catch {
      setFormError("This video could not be opened on your device. Try another clip.");
    }
  }

  function handleVideoChange(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    processVideoFile(file);
  }

  function handleVideoDragOver(event) {
    event.preventDefault();
    if (!videoFile) setVideoDragActive(true);
  }

  function handleVideoDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setVideoDragActive(false);
    }
  }

  function handleVideoDrop(event) {
    event.preventDefault();
    setVideoDragActive(false);
    processVideoFile(event.dataTransfer.files?.[0]);
  }

  function removeVideo() {
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.removeAttribute("src");
      videoElementRef.current.load();
    }
    const activeUrl = videoObjectUrlRef.current;
    videoObjectUrlRef.current = "";
    if (activeUrl) URL.revokeObjectURL(activeUrl);

    setVideoFile(null);
    setVideoUrl("");
    setVideoPreviewError("");
    setPreviewErrorCode(null);
    setCompatiblePreviewUrl("");
    if (compatiblePreviewPath && supabase) {
      void supabase.storage.from("emm-source-videos").remove([compatiblePreviewPath]);
    }
    setCompatiblePreviewPath("");
    setPreviewConversionMessage("");
    previewAutoAttemptRef.current = false;
    setSavedProjectId("");
    setRenderId("");
    setRenderStatus("");
    setRenderMessage("");
    setRenderReady(false);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function retryVideoPreview() {
    const player = videoElementRef.current;
    if (!player || !videoUrl) return;

    setVideoPreviewError("");
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      // Some mobile browsers do not allow seeking until metadata is ready.
    }
    player.load();
  }

  function handleVideoPlaybackError(event) {
    const player = event.currentTarget;
    const mediaError = player.error;
    const errorCode = mediaError?.code;
    const messages = {
      1: "The browser interrupted playback before the clip finished. Retry the preview. If it stops at the same point again, the source file may be incomplete.",
      2: "The browser stopped reading the selected video before it finished. Retry the preview. If it stops at the same point, the file may be damaged or the phone may not be reading its format reliably.",
      3: "The clip started playing, but this device could not decode a later part of it. The video may use a codec or encoding profile this browser cannot play reliably.",
      4: "This browser does not support the video's container or codec. An H.264 MP4 is the most compatible local preview format.",
    };
    const fallback = "The browser could not continue playing this local video.";
    const detail = mediaError?.message
      ? " Browser detail: " + String(mediaError.message).slice(0, 160)
      : Number.isFinite(errorCode)
        ? " Media error code: " + errorCode + "."
        : " The browser did not provide a media error code.";
    // Automatically recover from unsupported format/codec errors for signed-in users.
    if ((errorCode === 3 || errorCode === 4) && user && supabase && !previewAutoAttemptRef.current) {
      previewAutoAttemptRef.current = true;
      setPreviewErrorCode(errorCode);
      setVideoPreviewError("");
      void prepareCompatiblePreview();
      return;
    }

    setPreviewErrorCode(errorCode ?? null);
    setVideoPreviewError(
      (messages[errorCode] || fallback) +
      detail
    );
  }

  async function prepareCompatiblePreview() {
    if (!videoFile || !supabaseConfigured || !supabase) {
      setPreviewConversionMessage("Sign in to your Pilgrix workspace to prepare a compatible cloud preview.");
      setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
      setAuthMessage("Sign in to convert this clip into a browser-friendly MP4 preview.");
      setAuthOpen(true);
      return;
    }
    if (!user) {
      setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
      setAuthMessage("Sign in to convert this clip into a browser-friendly MP4 preview.");
      setAuthOpen(true);
      return;
    }
    if (videoFile.size > 104857600) {
      setPreviewConversionMessage("This clip is larger than Pilgrix's current 100 MB upload limit. Choose a smaller video.");
      return;
    }
    if (compatiblePreviewUrl) return;

    setPreviewConverting(true);
    setPreviewConversionMessage("Preparing a temporary copy for Shotstack compatibility conversion…");
    let storagePath = "";
    let providerAcceptedSource = false;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Your session has expired. Sign in again and retry.");

      const extension = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
      const inferredMime = ({
        mp4: "video/mp4",
        mov: "video/quicktime",
        webm: "video/webm",
        m4v: "video/x-m4v",
        "3gp": "video/3gpp",
      })[extension] || "video/mp4";
      const uploadMime = videoFile.type && videoFile.type !== "application/octet-stream"
        ? videoFile.type
        : inferredMime;
      const safeName = videoFile.name.normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(-100) || "source-video";
      storagePath = user.id + "/preview/" + crypto.randomUUID() + "-" + safeName;

      const { error: uploadError } = await supabase.storage.from("emm-source-videos").upload(storagePath, videoFile, {
        cacheControl: "3600",
        contentType: uploadMime,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      setPreviewConversionMessage("Sending the clip to the cloud converter…");
      const startResponse = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ storagePath }),
      });
      const startResult = await startResponse.json().catch(() => ({}));
      if (!startResponse.ok || !startResult.token) {
        throw new Error(startResult.error || "Pilgrix could not start the compatible preview conversion.");
      }
      providerAcceptedSource = true;

      // Shotstack fetches the signed source URL asynchronously. Keep the private
      // upload until its source status confirms that ingestion has completed.
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (attempt > 0) {
          setPreviewConversionMessage("Converting your clip into a browser-friendly MP4…");
          await new Promise((resolve) => window.setTimeout(resolve, 3000));
        }

        const statusResponse = await fetch("/api/preview?token=" + encodeURIComponent(startResult.token), {
          headers: { Authorization: "Bearer " + session.access_token, Accept: "application/json" },
          cache: "no-store",
        });
        const statusResult = await statusResponse.json().catch(() => ({}));
        if (!statusResponse.ok) {
          throw new Error(statusResult.error || "The compatible preview conversion failed.");
        }

        if (statusResult.sourceIngested && storagePath) {
          const { error: cleanupError } = await supabase.storage.from("emm-source-videos").remove([storagePath]);
          if (cleanupError) {
            setPreviewConversionMessage("The source was converted. Pilgrix could not remove the temporary upload automatically.");
          }
          storagePath = "";
        }

        if (statusResult.status === "failed") {
          throw new Error(statusResult.message || "The compatible preview conversion failed.");
        }
        if (statusResult.status === "ready" && statusResult.url) {
          setCompatiblePreviewUrl(statusResult.url);
          setCompatiblePreviewPath(statusResult.storagePath || "");
          setVideoPreviewError("");
          setPreviewErrorCode(null);
          setPreviewConversionMessage("Compatible MP4 ready in your private Pilgrix workspace. Your original video is unchanged.");
          return;
        }
        setPreviewConversionMessage(statusResult.message || "Converting your clip…");
      }

      throw new Error("The preview conversion is taking longer than expected. The private upload has been kept while Shotstack finishes fetching it. Try again in a moment.");
    } catch (error) {
      const message = error.message || "Pilgrix could not prepare a compatible preview.";
      setPreviewConversionMessage(message);
      setVideoPreviewError((current) => current || "This browser cannot play the original video. " + message);
    } finally {
      // Clean up only when the provider never accepted the source. Once queued,
      // deleting it before ingestion finishes would break the provider fetch.
      if (storagePath && !providerAcceptedSource) {
        const { error: cleanupError } = await supabase.storage.from("emm-source-videos").remove([storagePath]);
        if (cleanupError) {
          // The source remains private in the user's own storage folder.
        }
      }
      setPreviewConverting(false);
    }
  }

  function updateBrief(field, value) {
    setBrief((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
    if (adPlan) {
      setAdPlan(null);
      setPlanApproved(false);
      setRenderId("");
      setRenderStatus("");
      setRenderMessage("");
      setRenderReady(false);
      setSaveMessage("Your brief changed. Generate a fresh plan to keep everything in sync.");
    }
  }

  function jumpTo(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAdBuilder() {
    if (!videoFile) {
      setFormError("Choose a source video before you start creating an ad.");
      jumpTo(videoSectionRef);
      return;
    }
    setFormError("");
    setGenerationMessage("");
    setSaveMessage("");
    setAdPlan(null);
    setPlanApproved(false);
    setSavedProjectId("");
    setRenderId("");
    setRenderStatus("");
    setRenderMessage("");
    setRenderReady(false);
    setBuilderStep(1);
    setReviewOpen(true);
  }

  function continueFromBrief() {
    if (!brief.productName.trim()) {
      setGenerationMessage("Add the product or service name to continue.");
      return;
    }
    if (!brief.benefit.trim()) {
      setGenerationMessage("Describe the main benefit before continuing.");
      return;
    }
    setGenerationMessage("");
    setBuilderStep(2);
  }

  async function generateAdPlan() {
    if (!videoFile) {
      setGenerationMessage("Choose a source video before generating an ad plan.");
      return;
    }
    if (!user || !supabase) {
      setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
      setAuthMessage("Sign in or create an account to use AI ad generation.");
      setAuthOpen(true);
      return;
    }
    setGeneratingPlan(true);
    setGenerationMessage("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
        setAuthMessage("Your session has expired. Sign in again to generate the ad plan.");
        setAuthOpen(true);
        return;
      }

      const response = await fetch("/api/ad-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          brief: {
            productName: brief.productName.trim(),
            benefit: brief.benefit.trim(),
            audience: brief.audience.trim(),
            goal: brief.goal,
            platform: brief.platform,
            aspectRatio: brief.aspectRatio,
            targetDuration: Number(brief.targetDuration),
            language: brief.language,
            visualStyle: brief.visualStyle,
            captions: brief.captions,
            voiceover: brief.voiceover,
            music: brief.music,
          },
          sourceVideoName: videoFile.name,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Pilgrix could not generate the ad plan. Please try again.");
      if (!result.plan || !Array.isArray(result.plan.scenes)) {
        throw new Error("The planning service returned an incomplete ad plan. Please try again.");
      }
      setAdPlan(result.plan);
      setPlanApproved(false);
      setBuilderStep(3);
      setGenerationMessage("");
    } catch (error) {
      setGenerationMessage(error.message || "Something went wrong while generating your ad plan.");
    } finally {
      setGeneratingPlan(false);
    }
  }

  function updatePlan(field, value) {
    setAdPlan((current) => current ? { ...current, [field]: value } : current);
    setPlanApproved(false);
    setRenderId("");
    setRenderStatus("");
    setRenderMessage("");
    setRenderReady(false);
  }

  function approvePlan() {
    if (!adPlan) return;
    setPlanApproved(true);
    setBuilderStep(4);
    setSaveMessage("");
    setRenderMessage("");
  }

  async function pollVideoRender(projectId, accessToken) {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 5000));
      const response = await fetch("/api/render?projectId=" + encodeURIComponent(projectId), {
        headers: { Authorization: "Bearer " + accessToken, Accept: "application/json" },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not check the video render.");
      setRenderStatus(result.message || "Your video is being rendered.");
      if (result.status === "done") {
        setRenderReady(true);
        setRenderStatus("Your finished MP4 is ready to download.");
        return true;
      }
      if (result.status === "failed") {
        setRenderId("");
        throw new Error(result.message || "The render failed. Review the ad plan and try again.");
      }
    }
    setRenderStatus("Your render is still processing. Check the status again in a moment.");
    return false;
  }

  async function renderFinalVideo() {
    if (!adPlan || !planApproved) {
      setRenderMessage("Approve your ad plan before rendering the final video.");
      return;
    }
    if (!supabase || !user) {
      setAuthMode("sign-in");
      setAuthOtpStep(false);
      setAuthOtp("");
      setAuthMessage("Sign in to save your source video and render the final ad.");
      setAuthOpen(true);
      return;
    }

    setRenderingVideo(true);
    setRenderMessage("");
    setRenderStatus("Saving your approved ad and source video…");
    try {
      const projectId = await saveDraft();
      if (!projectId) throw new Error("Save your approved ad plan before starting the render.");

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Your session has expired. Sign in again to render the video.");

      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ projectId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Pilgrix could not start the video render.");
      setRenderId(result.renderId);
      setRenderReady(false);
      setRenderStatus(result.message || "Your video is queued for rendering.");
      await pollVideoRender(projectId, session.access_token);
    } catch (error) {
      setRenderMessage(error.message || "The video could not be rendered. Please try again.");
    } finally {
      setRenderingVideo(false);
    }
  }

  async function checkVideoRenderStatus() {
    if (!savedProjectId || !renderId || !supabase) return;
    setRenderingVideo(true);
    setRenderMessage("");
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.access_token) throw new Error("Your session has expired. Sign in again to check the render.");
      await pollVideoRender(savedProjectId, session.access_token);
    } catch (error) {
      setRenderMessage(error.message || "Could not check the render status.");
    } finally {
      setRenderingVideo(false);
    }
  }

  async function downloadRenderedVideo() {
    if (!savedProjectId || !supabase) return;
    setDownloadingVideo(true);
    setRenderMessage("");
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.access_token) throw new Error("Sign in again to download your rendered video.");

      const response = await fetch("/api/render?projectId=" + encodeURIComponent(savedProjectId) + "&download=1", {
        headers: { Authorization: "Bearer " + session.access_token },
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "The finished MP4 could not be downloaded.");
      }
      const videoBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      const safeName = (brief.productName || "emm-ad").trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "emm-ad";
      link.href = downloadUrl;
      link.download = safeName + ".mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
    } catch (error) {
      setRenderMessage(error.message || "The MP4 download failed. Please try again.");
    } finally {
      setDownloadingVideo(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden pb-12">

      <header className="topbar-wrap">
        <div className="topbar glass-panel">
          <a className="brand-lockup" href="#home" aria-label="Pilgrix Ads Studio home">
            <span className="brand-mark">P</span>
            <span className="brand-copy">
              <strong>Pilgrix Ads Studio</strong>
              <small>AI ADVERTISING WORKSPACE</small>
            </span>
          </a>
          <nav className="topbar-nav" aria-label="Main navigation">
            <a href="#source-video">Source video</a>
            <a href="#product-brief">How it works</a>
            {user && <a href="/studio">Your workspace</a>}
          </nav>
          <div className="topbar-actions">
            {user ? (
              <>
                <a className="button button-quiet topbar-action" href="/studio">Open workspace</a>
                <button className="button button-quiet topbar-action" type="button" onClick={handleSignOut}>
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <button className="button button-quiet topbar-action" type="button" onClick={() => {
                setAuthMode("sign-in");
                setAuthOtpStep(false);
                setAuthOtp("");
                setAuthMessage("");
                setAuthOpen(true);
              }}>
                Sign in
              </button>
            )}
            <button className="button button-dark topbar-action topbar-new-ad" type="button" onClick={openAdBuilder}>
              <Icon name="plus" size={14} />
              <span>Start a new ad</span>
            </button>
          </div>
        </div>
      </header>

      <div className="workspace" id="home">
        <section className="hero-grid hero-grid-premium">
          <div className="hero-copy hero-copy-premium">
            <div className="eyebrow"><span className="eyebrow-dot" /> VIDEO-FIRST AI AD CREATION</div>
            <h1>
              Turn your footage
              <span className="headline-second">into a <span className="headline-highlight">polished ad.</span></span>
            </h1>
            <p className="hero-description">
              Start with the video you already have. Pilgrix helps shape the hook, script and scene plan, then renders the edit you approve.
            </p>
            <div className="hero-actions hero-actions-premium">
              <button className="button button-dark" type="button" onClick={openVideoPicker}>
                <Icon name="upload" size={16} /> Upload a source video
              </button>
              <button className="text-action" type="button" onClick={openAdBuilder}>
                Open the ad builder <Icon name="arrow" size={15} />
              </button>
            </div>
            <div className="hero-proof-row">
              <span><Icon name="check" size={14} /> Built around your footage</span>
              <i />
              <span><Icon name="check" size={14} /> Edit before you approve</span>
              <i />
              <span><Icon name="check" size={14} /> Download the finished MP4</span>
            </div>
          </div>

          <aside className="hero-showcase" aria-label="Pilgrix creative workflow preview">
            <div className="hero-showcase-top">
              <div className="hero-showcase-brand">
                <span className="hero-showcase-mark">P</span>
                <span><strong>PILGRIX</strong><small>CREATIVE STUDIO</small></span>
              </div>
              <span className="hero-showcase-live"><i /> WORKFLOW PREVIEW</span>
            </div>

            <div className="hero-showcase-screen">
              <div className="hero-screen-topline">
                <span>AD STORYBOARD</span>
                <span>01 / 03</span>
              </div>
              <div className="hero-screen-art">
                <span className="hero-art-orbit hero-art-orbit-one" />
                <span className="hero-art-orbit hero-art-orbit-two" />
                <span className="hero-art-glow" />
                <span className="hero-art-tag"><Icon name="film" size={12} /> SOURCE FOOTAGE</span>
                <span className="hero-art-play"><Icon name="play" size={22} /></span>
                <span className="hero-art-caption">YOUR PRODUCT.<br /><b>YOUR STORY.</b></span>
                <span className="hero-art-ratio">9:16</span>
              </div>
              <div className="hero-screen-footer">
                <span><i /> BUILT FROM YOUR BRIEF</span>
                <strong>Ready for your review.</strong>
              </div>
            </div>

            <div className="hero-workflow-steps">
              <div><span>01</span><strong>Upload</strong><small>Your video</small></div>
              <span className="hero-workflow-connector" />
              <div><span>02</span><strong>Shape</strong><small>Your ad plan</small></div>
              <span className="hero-workflow-connector" />
              <div><span>03</span><strong>Render</strong><small>Your final edit</small></div>
            </div>
          </aside>
        </section>

        <section className="content-grid">
          <section className="surface-card video-card" ref={videoSectionRef} id="source-video">
            <div className="section-heading">
              <div>
                <div className="section-kicker">SOURCE VIDEO</div>
                <h2>Start with your source video</h2>
                <p>Choose the clip you want to turn into an advertisement. Preview it before you begin.</p>
              </div>
              <span className={`status-chip ${videoFile ? "status-ready" : ""}`}>
                <span className="status-dot" />
                {videoFile ? "VIDEO READY" : "NO VIDEO"}
              </span>
            </div>

            <div
              className={`video-stage ${videoFile ? "video-stage-loaded" : ""} ${videoDragActive ? "video-drag-active" : ""}`}
              onDragOver={handleVideoDragOver}
              onDragLeave={handleVideoDragLeave}
              onDrop={handleVideoDrop}
              aria-label="Source video upload and preview"
            >
              {videoUrl ? (
                <>
                  <video
                    key={compatiblePreviewUrl || videoUrl}
                    ref={videoElementRef}
                    className="video-player"
                    src={compatiblePreviewUrl || videoUrl}
                    controls
                    playsInline
                    preload={videoFile?.size <= 104857600 ? "auto" : "metadata"}
                    aria-label={`Preview of ${videoFile?.name || "selected video"}`}
                    onLoadedMetadata={() => {
                      setVideoPreviewError("");
                      setPreviewErrorCode(null);
                    }}
                    onCanPlay={() => {
                      setVideoPreviewError("");
                      setPreviewErrorCode(null);
                    }}
                    onError={handleVideoPlaybackError}
                  />
                  <button className="video-remove-overlay" type="button" onClick={removeVideo} aria-label="Remove selected video" title="Remove video">
                    <Icon name="close" size={19} />
                  </button>
                  {videoPreviewError && (
                    <div className="video-preview-feedback" role="alert">
                      <p className="video-preview-error">{videoPreviewError}</p>
                      <div className="video-preview-actions">
                        <button className="video-preview-retry" type="button" onClick={retryVideoPreview}>
                          Retry preview
                        </button>
                        {(previewErrorCode === 3 || previewErrorCode === 4) && !compatiblePreviewUrl && (
                          <button
                            className="video-preview-convert"
                            type="button"
                            onClick={prepareCompatiblePreview}
                            disabled={previewConverting}
                          >
                            {previewConverting ? "Preparing MP4…" : "Prepare compatible preview"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {previewConversionMessage && (
                    <p className="video-preview-conversion-status" role="status">
                      {previewConversionMessage}
                    </p>
                  )}
                </>
              ) : (
                <div className="video-empty">
                  <div className="video-empty-icon"><Icon name="upload" size={20} /></div>
                  <strong>No video selected</strong>
                  <p>Choose a clip from your device or drag it into this area. You can preview it before building your ad.</p>
                  <button className="button button-lime upload-button" type="button" onClick={openVideoPicker}>
                    <Icon name="upload" size={16} /> Browse videos
                  </button>
                  <span className="video-empty-formats">MP4, MOV or WEBM · Up to 100 MB for cloud processing</span>
                </div>
              )}
            </div>

            {videoFile && (
              <div className="video-selected-meta">
                <span className="video-selected-icon"><Icon name="film" size={16} /></span>
                <span className="video-selected-copy">
                  <strong title={videoFile.name}>{videoFile.name}</strong>
                  <small>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Ready for your ad brief</small>
                </span>
                <button type="button" onClick={openVideoPicker}>Replace</button>
              </div>
            )}
            <div className="video-foot video-foot-premium">
              <span><Icon name="shield" size={14} /> Your original clip stays unchanged. Unsupported formats may be converted for preview.</span>
              <span>MP4 · MOV · WEBM</span>
            </div>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              aria-label="Choose a video file"
            />
          </section>

          <section className="surface-card brief-card generate-launch-card" ref={briefSectionRef} id="product-brief">
            <div className="section-heading brief-heading">
              <div>
                <div className="section-kicker">CREATE YOUR AD</div>
                <h2>Shape your next ad.</h2>
                <p>Give Pilgrix the product details and creative direction. Review the proposed story before anything is rendered.</p>
              </div>
              <span className="brief-icon"><Icon name="sliders" size={18} /></span>
            </div>
            <div className="generate-launch-content">
              <div className="launch-step-list">
                <div><span className="launch-step-number" aria-hidden="true">01</span><strong>Edit your brief</strong><small>Add the product details, benefit and target audience.</small></div>
                <div><span className="launch-step-number" aria-hidden="true">02</span><strong>Choose your creative direction</strong><small>Choose the platform, aspect ratio, style, captions and audio.</small></div>
                <div><span className="launch-step-number" aria-hidden="true">03</span><strong>Review, approve and render</strong><small>Refine the hook, script, scene directions and call to action before rendering.</small></div>
              </div>
              <button className="button button-lime generate-launch-button" type="button" onClick={openAdBuilder}>
                <Icon name="film" size={17} /> Open the ad builder <Icon name="arrow" size={16} />
              </button>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <p className="launch-footnote">Your settings remain editable until you approve the ad plan.</p>
            </div>
          </section>
        </section>

        {user && (
          <section className="surface-card saved-projects" id="recent-projects">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR Pilgrix WORKSPACE</div>
                <h2>Recent drafts</h2>
                <p>Your private projects, saved to Supabase.</p>
              </div>
              <span className="status-chip status-ready"><span className="status-dot" />SYNCED</span>
            </div>
            {projectsLoading ? (
              <p className="saved-empty">Loading your drafts…</p>
            ) : savedProjects.length ? (
              <div className="saved-project-list">
                {savedProjects.map((project) => (
                  <div className="saved-project-row" key={project.id}>
                    <span className="saved-project-icon"><Icon name="film" size={16} /></span>
                    <span className="saved-project-copy">
                      <strong>{project.title}</strong>
                      <small>Source video attached</small>
                    </span>
                    <span className="saved-project-status">{(project.status || "draft").replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="saved-empty">No saved drafts yet. Review a brief and save it to start your workspace.</p>
            )}
          </section>
        )}

        <div className="prototype-note">
          <span className="prototype-pulse" />
          <span>Pilgrix ADS WORKSPACE</span>
          <i />
          <span>AI ad planning and cloud video rendering are connected</span>
        </div>
        <footer className="footer-line">
          <span>Pilgrix ADS STUDIO</span>
          <span>CREATE. REVIEW. APPROVE.</span>
        </footer>
      </div>

      {reviewOpen && (
        <div className="modal-backdrop builder-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !generatingPlan && !saving && !renderingVideo) setReviewOpen(false);
        }}>
          <section className="review-modal builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-title">
            <div className="builder-shell">
              <aside className="builder-aside">
                <a className="builder-brand" href="#home" aria-label="Pilgrix Ads Studio home">
                  <span className="builder-brand-mark">P</span>
                  <span><strong>PILGRIX</strong><small>ADS STUDIO</small></span>
                </a>
                <div className="builder-aside-intro">
                  <span className="builder-aside-eyebrow">AD CREATION WORKSPACE</span>
                  <h2>Make every second count.</h2>
                  <p>A guided creative process, from your first brief to a finished ad.</p>
                </div>
                <nav className="builder-step-nav" aria-label="Ad creation steps">
                  {[
                    { id: 1, title: "Your brief", description: "Product & audience" },
                    { id: 2, title: "Creative direction", description: "Format & style" },
                    { id: 3, title: "Review the plan", description: "Hook, script & scenes" },
                    { id: 4, title: "Approve & render", description: "Save your final brief" },
                  ].map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`builder-side-step ${builderStep === step.id ? "builder-side-step-active" : builderStep > step.id ? "builder-side-step-done" : ""}`}
                      onClick={() => {
                        if (step.id < builderStep && !generatingPlan && !saving && !renderingVideo) {
                          setBuilderStep(step.id);
                          setGenerationMessage("");
                        }
                      }}
                      disabled={step.id >= builderStep || generatingPlan || saving || renderingVideo}
                      aria-current={builderStep === step.id ? "step" : undefined}
                    >
                      <span className="builder-side-step-number">
                        {builderStep > step.id ? <Icon name="check" size={14} /> : String(step.id).padStart(2, "0")}
                      </span>
                      <span className="builder-side-step-copy">
                        <strong>{step.title}</strong>
                        <small>{step.description}</small>
                      </span>
                      {builderStep === step.id && <span className="builder-side-step-marker" />}
                    </button>
                  ))}
                </nav>
                <div className="builder-aside-video">
                  <span className="builder-aside-video-icon"><Icon name="film" size={16} /></span>
                  <span><strong>Source video</strong><small title={videoFile?.name || ""}>{videoFile?.name || "No video selected"}</small></span>
                  <span className="builder-aside-video-status"><Icon name="check" size={13} /></span>
                </div>
                <div className="builder-aside-footer">
                  <Icon name="shield" size={15} />
                  <span>Your creative stays in your private workspace until you choose to render.</span>
                </div>
              </aside>

              <div className="builder-main" ref={builderMainRef}>
                <div className="modal-topline builder-topline">
              <div>
                <span className="section-kicker">CREATE YOUR AD</span>
                <div className="builder-progress" role="progressbar" aria-label="Ad creation progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={builderStep}>
                  {[1, 2, 3, 4].map((step) => <span key={step} className={builderStep >= step ? "builder-progress-active" : ""} />)}
                </div>
              </div>
              <button className="modal-close" type="button" aria-label="Close ad builder" onClick={() => setReviewOpen(false)} disabled={generatingPlan || saving || renderingVideo}>
                <Icon name="close" size={18} />
              </button>
            </div>

            {builderStep === 1 && (
              <div className="builder-brief-step">
                <div className="builder-step-kicker"><Icon name="edit" size={14} /> YOUR BRIEF</div>
                <div className="builder-brief-heading">
                  <div>
                    <h2 id="builder-title">Tell us about your product.</h2>
                    <p className="modal-intro">Share a few details so Pilgrix can shape an ad around what you offer and who you want to reach.</p>
                  </div>
                  <span className="builder-brief-index">01 <i /> 04</span>
                </div>

                <div className="builder-video-chip">
                  <span className="builder-video-chip-icon"><Icon name="film" size={16} /></span>
                  <span className="builder-video-copy">
                    <strong>Source video attached</strong>
                    <small>{videoFile?.name || "Ready to use in your ad"}</small>
                  </span>
                  <button type="button" onClick={() => { setReviewOpen(false); jumpTo(videoSectionRef); }}>Change</button>
                </div>

                <div className="builder-brief-section-heading">
                  <span>PRODUCT DETAILS</span>
                  <small><b>*</b> Required fields</small>
                </div>
                <div className="builder-fields builder-brief-fields">
                  <label className="field-group brief-field-product">
                    <span className="field-label">Product or service name <b>*</b></span>
                    <input value={brief.productName} onChange={(event) => updateBrief("productName", event.target.value)} maxLength={120} placeholder="e.g. Pilgrix AI, FreshBite Cafe" autoComplete="off" />
                  </label>
                  <label className="field-group brief-field-benefit">
                    <span className="field-label">What makes it worth choosing? <b>*</b></span>
                    <textarea value={brief.benefit} onChange={(event) => updateBrief("benefit", event.target.value)} rows={4} placeholder="Describe what it does, the problem it solves, and the main benefit customers get. Add as much detail as you need." />
                    <span className="field-counter">{brief.benefit.length.toLocaleString()} characters</span>
                  </label>
                  <label className="field-group brief-field-audience">
                    <span className="field-label">Who is this for?</span>
                    <input value={brief.audience} onChange={(event) => updateBrief("audience", event.target.value)} maxLength={120} placeholder="e.g. Students, creators, small businesses" autoComplete="off" />
                  </label>
                  <label className="field-group brief-field-goal">
                    <span className="field-label">What should the ad achieve?</span>
                    <select value={brief.goal} onChange={(event) => updateBrief("goal", event.target.value)}>
                      <option>Build awareness</option>
                      <option>Explain the product or service</option>
                      <option>Promote an offer</option>
                      <option>Get more enquiries</option>
                      <option>Drive website visits or sales</option>
                    </select>
                  </label>
                </div>
                {generationMessage && <p className="generation-feedback" role="alert">{generationMessage}</p>}
                <div className="modal-actions builder-actions">
                  <button className="button button-lime review-button" type="button" onClick={continueFromBrief}>Continue to creative settings <Icon name="arrow" size={16} /></button>
                </div>
              </div>
            )}

            {builderStep === 2 && (
              <>
                <div className="builder-step-kicker"><Icon name="sliders" size={14} /> CREATIVE SETTINGS</div>
                <h2 id="builder-title">Choose your ad format and style.</h2>
                <p className="modal-intro">Set the destination platform, video format, language and creative treatment.</p>
                <div className="builder-fields builder-fields-grid">
                  <label className="field-group">
                    <span className="field-label">PLATFORM</span>
                    <select value={brief.platform} onChange={(event) => updateBrief("platform", event.target.value)} disabled={generatingPlan}>
                      <option>Instagram Reels</option><option>TikTok</option><option>YouTube Shorts</option><option>Facebook</option><option>YouTube (landscape)</option><option>Custom</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">VIDEO FORMAT</span>
                    <select value={brief.aspectRatio} onChange={(event) => updateBrief("aspectRatio", event.target.value)} disabled={generatingPlan}>
                      <option value="9:16">Vertical · 9:16</option><option value="1:1">Square · 1:1</option><option value="16:9">Landscape · 16:9</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">TARGET LENGTH</span>
                    <select value={brief.targetDuration} onChange={(event) => updateBrief("targetDuration", event.target.value)} disabled={generatingPlan}>
                      <option value="15">15 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">LANGUAGE</span>
                    <select value={brief.language} onChange={(event) => updateBrief("language", event.target.value)} disabled={generatingPlan}>
                      <option>English</option><option>Nigerian Pidgin</option><option>Yoruba</option><option>Hausa</option><option>Igbo</option><option>French</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">VISUAL STYLE</span>
                    <select value={brief.visualStyle} onChange={(event) => updateBrief("visualStyle", event.target.value)} disabled={generatingPlan}>
                      <option>Premium and polished</option><option>Bold and energetic</option><option>Clean and minimal</option><option>Warm and relatable</option><option>Cinematic</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">CAPTIONS</span>
                    <select value={brief.captions} onChange={(event) => updateBrief("captions", event.target.value)} disabled={generatingPlan}>
                      <option>Clean subtitles</option><option>Animated captions</option><option>No captions</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">VOICEOVER</span>
                    <select value={brief.voiceover} onChange={(event) => updateBrief("voiceover", event.target.value)} disabled={generatingPlan}>
                      <option>No voiceover</option><option>Natural voiceover</option><option>Energetic voiceover</option><option>Warm conversational voiceover</option>
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">AUDIO</span>
                    <select value={brief.music} onChange={(event) => updateBrief("music", event.target.value)} disabled={generatingPlan}>
                      <option>Keep original audio</option><option>Lower original audio</option><option>Mute original audio</option>
                    </select>
                  </label>
                </div>
                {generationMessage && <p className="generation-feedback" role="alert">{generationMessage}</p>}
                {generatingPlan && (
                  <div className="builder-working-card" role="status" aria-live="polite">
                    <span className="builder-working-orbit"><span /></span>
                    <div className="builder-working-copy">
                      <span>YOUR AI CREATIVE DIRECTOR</span>
                      <strong>Shaping your ad concept…</strong>
                      <p>Turning your brief into a clear hook, script and scene-by-scene direction. This can take a moment.</p>
                    </div>
                    <div className="builder-working-indicator"><i /><i /><i /></div>
                  </div>
                )}
                <div className="builder-info-note"><Icon name="info" size={15} /><span>AI planning uses your written brief and settings; it does not analyse the actual video frames yet. Cloud voiceover currently supports English and French. For Nigerian Pidgin, Yoruba, Hausa or Igbo, choose No voiceover; captions can still be generated from the source audio.</span></div>
                <div className="modal-actions builder-actions builder-actions-split">
                  <button className="button button-quiet review-button" type="button" onClick={() => { setGenerationMessage(""); setBuilderStep(1); }}>Back</button>
                  <button className="button button-lime review-button" type="button" onClick={generateAdPlan} disabled={generatingPlan}>
                    {generatingPlan ? "Building your plan…" : "Generate ad plan"} <Icon name="arrow" size={16} />
                  </button>
                </div>
              </>
            )}

            {builderStep === 3 && adPlan && (
              <>
                <div className="builder-step-kicker"><Icon name="check" size={14} /> REVIEW YOUR AD PLAN</div>
                <h2 id="builder-title">Review and refine your ad plan.</h2>
                <p className="modal-intro">Edit the opening hook, script, scene directions, captions and call to action before approval.</p>
                <div className="plan-review-summary">
                  <div><span>FORMAT</span><strong>{brief.platform} · {brief.aspectRatio}</strong></div>
                  <div><span>LENGTH</span><strong>{brief.targetDuration} seconds</strong></div>
                  <div><span>SCENES</span><strong>{adPlan.scenes.length} planned</strong></div>
                </div>
                <div className="plan-editor">
                  <label className="field-group">
                    <span className="field-label">AD TITLE</span>
                    <input value={adPlan.projectTitle || ""} onChange={(event) => updatePlan("projectTitle", event.target.value)} maxLength={120} />
                  </label>
                  <label className="field-group">
                    <span className="field-label">OPENING HOOK · CHOOSE OR EDIT</span>
                    <div className="hook-options">
                      {(adPlan.hooks || []).map((hook, index) => (
                        <button key={index} type="button" className={adPlan.selectedHook === hook ? "hook-option hook-option-active" : "hook-option"} onClick={() => updatePlan("selectedHook", hook)}>
                          {hook}
                        </button>
                      ))}
                    </div>
                    <textarea value={adPlan.selectedHook || ""} onChange={(event) => updatePlan("selectedHook", event.target.value)} rows={2} maxLength={280} />
                  </label>
                  <label className="field-group">
                    <span className="field-label">AD SCRIPT</span>
                    <textarea value={adPlan.script || ""} onChange={(event) => updatePlan("script", event.target.value)} rows={6} maxLength={4000} />
                  </label>
                  <div className="scene-editor-list">
                    <div className="scene-editor-heading"><strong>SCENE-BY-SCENE DIRECTION</strong></div>
                    {adPlan.scenes.map((scene, index) => (
                      <div className="scene-editor-card" key={index}>
                        <div className="scene-editor-title"><span>SCENE {String(index + 1).padStart(2, "0")}</span>{scene.time && <strong>{scene.time}</strong>}</div>
                        <label className="field-group"><span className="field-label">VISUAL DIRECTION</span><textarea rows={2} value={scene.visualDirection || ""} onChange={(event) => updatePlan("scenes", adPlan.scenes.map((item, i) => i === index ? { ...item, visualDirection: event.target.value } : item))} /></label>
                        <label className="field-group"><span className="field-label">VOICEOVER / SPOKEN LINE</span><textarea rows={2} value={scene.voiceover || ""} onChange={(event) => updatePlan("scenes", adPlan.scenes.map((item, i) => i === index ? { ...item, voiceover: event.target.value } : item))} /></label>
                        <label className="field-group"><span className="field-label">ON-SCREEN TEXT</span><input value={scene.onScreenText || ""} onChange={(event) => updatePlan("scenes", adPlan.scenes.map((item, i) => i === index ? { ...item, onScreenText: event.target.value } : item))} /></label>
                      </div>
                    ))}
                  </div>
                  <label className="field-group">
                    <span className="field-label">CALL TO ACTION</span>
                    <input value={adPlan.callToAction || ""} onChange={(event) => updatePlan("callToAction", event.target.value)} maxLength={240} />
                  </label>
                  <label className="field-group">
                    <span className="field-label">SOCIAL CAPTION</span>
                    <textarea value={adPlan.captionText || ""} onChange={(event) => updatePlan("captionText", event.target.value)} rows={3} maxLength={1200} />
                  </label>
                  <label className="field-group">
                    <span className="field-label">EDITING NOTES</span>
                    <textarea value={adPlan.editNotes || ""} onChange={(event) => updatePlan("editNotes", event.target.value)} rows={3} maxLength={1000} />
                  </label>
                </div>
                <div className="builder-info-note"><Icon name="info" size={15} /><span>This is an AI-generated creative plan, not a rendered video. Your selected clip has not been visually analysed yet.</span></div>
                {generationMessage && <p className="generation-feedback" role="alert">{generationMessage}</p>}
                <div className="modal-actions builder-actions builder-actions-split">
                  <button className="button button-quiet review-button" type="button" onClick={() => setBuilderStep(2)}>Back to settings</button>
                  <button className="button button-lime review-button" type="button" onClick={approvePlan}>Approve this plan <Icon name="check" size={16} /></button>
                </div>
              </>
            )}

            {builderStep === 4 && adPlan && (
              <>
                <div className="builder-step-kicker"><Icon name="check" size={14} /> APPROVAL & SAVE</div>
                <h2 id="builder-title">Your ad plan is approved.</h2>
                <p className="modal-intro">Your approved creative plan is ready. Save it to your private Pilgrix workspace.</p>
                <div className="approved-plan-summary">
                  <div><span>CAMPAIGN</span><strong>{adPlan.projectTitle}</strong></div>
                  <div><span>PRODUCT / SERVICE</span><strong>{brief.productName}</strong></div>
                  <div><span>PLATFORM & FORMAT</span><strong>{brief.platform} · {brief.aspectRatio}</strong></div>
                  <div><span>TARGET LENGTH</span><strong>{brief.targetDuration} seconds</strong></div>
                  <div><span>WHO IT'S FOR</span><strong>{brief.audience || "Broad audience"}</strong></div>
                  <div><span>CREATIVE DIRECTION</span><strong>{adPlan.scenes.length} scenes · {brief.visualStyle}</strong></div>
                </div>
                <div className="builder-info-note builder-info-warning"><Icon name="info" size={15} /><span>Rendering sends your saved clip to Shotstack. Sandbox exports include a watermark; production renders use credits. Voiceover and captions may also use AI credits.</span></div>
                {(saving || renderingVideo || renderId || renderReady) && (
                  <div className={`render-state-card ${renderReady ? "render-state-ready" : "render-state-working"}`} role="status" aria-live="polite">
                    <span className="render-state-icon"><Icon name={renderReady ? "check" : "film"} size={19} /></span>
                    <div className="render-state-copy">
                      <span>{renderReady ? "RENDER COMPLETE" : saving ? "SAVING YOUR PROJECT" : renderingVideo ? "WORKING ON YOUR AD" : "CLOUD RENDER STATUS"}</span>
                      <strong>{renderReady ? "Your finished video is ready." : saving ? "Saving your approved creative…" : renderingVideo ? "Preparing your video…" : "Your video is processing."}</strong>
                      <p>{renderReady ? "Your MP4 is ready. Download it to review, share or publish." : renderStatus || "Your approved brief and source video are being prepared securely."}</p>
                    </div>
                    {!renderReady && <span className="render-state-live"><i /> LIVE</span>}
                    {!renderReady && <div className="render-state-progress"><span /></div>}
                  </div>
                )}
                {renderMessage && <p className="render-feedback render-feedback-error" role="alert">{renderMessage}</p>}
                {saveMessage && <p className={"save-feedback " + (savedProjectId ? "save-feedback-success" : "")} role="status">{saveMessage}</p>}
                <div className="modal-actions builder-actions">
                  {!savedProjectId && (
                    <button className="button button-lime review-button" type="button" onClick={saveDraft} disabled={saving || renderingVideo || downloadingVideo}>
                      {saving ? "Saving your ad plan…" : "Save approved ad plan"} <Icon name="check" size={16} />
                    </button>
                  )}
                  <button className="button button-dark review-button" type="button" onClick={renderFinalVideo} disabled={renderingVideo || saving || downloadingVideo || (Boolean(renderId) && !renderReady)}>
                    {renderingVideo ? "Rendering your video…" : renderReady ? "Render another version" : "Render final video"} <Icon name="film" size={16} />
                  </button>
                  {renderId && !renderReady && (
                    <button className="button button-quiet review-button" type="button" onClick={checkVideoRenderStatus} disabled={renderingVideo || downloadingVideo}>
                      {renderingVideo ? "Checking render…" : "Check render status"}
                    </button>
                  )}
                  {renderReady && (
                    <button className="button button-lime review-button" type="button" onClick={downloadRenderedVideo} disabled={downloadingVideo}>
                      {downloadingVideo ? "Preparing download…" : "Download finished MP4"} <Icon name="arrow" size={16} />
                    </button>
                  )}
                  <button className="button button-quiet review-button" type="button" onClick={() => { setBuilderStep(3); setPlanApproved(false); }}>Back to edit plan</button>
                  <button className="button button-quiet review-button" type="button" onClick={() => setReviewOpen(false)} disabled={renderingVideo || saving}>Close</button>
                </div>
              </>
            )}

            {builderStep === 3 && !adPlan && (
              <div className="builder-empty-state">
                <div className="modal-success-icon"><Icon name="check" size={20} /></div>
                <h2 id="builder-title">Your ad plan is waiting.</h2>
                <p className="modal-intro">Go back to creative settings and generate the plan.</p>
                <button className="button button-lime review-button" type="button" onClick={() => setBuilderStep(2)}>Back to settings</button>
              </div>
            )}
              </div>
            </div>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop auth-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !authBusy) {
            setAuthOpen(false);
            setAuthOtpStep(false);
            setAuthOtp("");
          }
        }}>
          <section className="review-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="auth-shell">
              <aside className="auth-aside">
                <div className="auth-brand-lockup">
                  <span className="auth-brand-mark">P</span>
                  <span className="auth-brand-name"><strong>PILGRIX</strong><small>ADS STUDIO</small></span>
                </div>
                <div className="auth-aside-copy">
                  <span className="auth-aside-label"><span /> YOUR CREATIVE WORKSPACE</span>
                  <h2>Good ideas deserve great execution.</h2>
                  <p>Bring your ad briefs, source videos and creative plans together in one focused studio.</p>
                </div>
                <div className="auth-benefits">
                  <div className="auth-benefit">
                    <span className="auth-benefit-icon"><Icon name="film" size={17} /></span>
                    <span><strong>Everything in one place</strong><small>Keep projects and source footage together.</small></span>
                  </div>
                  <div className="auth-benefit">
                    <span className="auth-benefit-icon"><Icon name="sliders" size={17} /></span>
                    <span><strong>A clearer creative process</strong><small>Shape your ideas into a practical ad plan.</small></span>
                  </div>
                </div>
                <div className="auth-aside-footer"><span className="auth-footer-dot" /> MADE FOR THE NEXT BIG IDEA</div>
              </aside>

              <div className="auth-main">
                <div className="auth-main-top">
                  <span>PILGRIX <i>/</i> ACCOUNT</span>
                  <button className="modal-close auth-close" type="button" aria-label="Close sign in" onClick={() => { setAuthOpen(false); setAuthOtpStep(false); setAuthOtp(""); }} disabled={authBusy}><Icon name="close" size={18} /></button>
                </div>
                <div className="auth-heading">
                  <span className="auth-eyebrow">{authMode === "sign-up" ? "GET STARTED" : "WELCOME BACK"}</span>
                  <h2 id="auth-title">{authOtpStep ? "Verify your email address." : authMode === "sign-up" ? "Create your account." : "Your studio awaits."}</h2>
                  <p>{authOtpStep ? "Enter the secure 6-digit code to activate your Pilgrix account." : authMode === "sign-up" ? "Set up your Pilgrix account and keep your creative work organised." : "Sign in to pick up where your next campaign left off."}</p>
                </div>

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  {!authOtpStep ? (
                    <>
                      <label className="field-group auth-field">
                        <span className="field-label">EMAIL ADDRESS</span>
                        <input type="email" autoComplete="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="name@company.com" />
                      </label>
                      <label className="field-group auth-field">
                        <span className="field-label">PASSWORD</span>
                        <span className="auth-password-control">
                          <input type={showAuthPassword ? "text" : "password"} autoComplete={authMode === "sign-up" ? "new-password" : "current-password"} minLength={8} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Enter your password" />
                          <button type="button" className="auth-password-toggle" onClick={() => setShowAuthPassword((value) => !value)} aria-label={showAuthPassword ? "Hide password" : "Show password"} aria-pressed={showAuthPassword}>
                            <Icon name={showAuthPassword ? "eye-off" : "eye"} size={17} />
                          </button>
                        </span>
                        {authMode === "sign-up" && <span className="auth-field-hint">Use at least 8 characters.</span>}
                      </label>
                      {authMessage && <p className="auth-feedback" role="status">{authMessage}</p>}
                      <button className="button button-dark review-button auth-submit" type="submit" disabled={authBusy || !supabaseConfigured}>
                        <span>{authBusy ? "Please wait…" : authMode === "sign-up" ? "Create account" : "Sign in to Pilgrix"}</span>
                        {!authBusy && <Icon name="arrow" size={17} />}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="auth-otp-copy">
                        <span className="field-label">EMAIL VERIFICATION</span>
                        <p>Enter the 6-digit code sent to</p>
                        <strong>{authEmail}</strong>
                      </div>
                      <label className="field-group auth-field">
                        <span className="field-label">VERIFICATION CODE</span>
                        <input
                          className="auth-otp-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          required
                          value={authOtp}
                          onChange={(event) => setAuthOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          aria-label="6-digit email verification code"
                        />
                      </label>
                      {authMessage && <p className="auth-feedback" role="status">{authMessage}</p>}
                      <button className="button button-dark review-button auth-submit" type="submit" disabled={authBusy || !supabaseConfigured || authOtp.length !== 6}>
                        <span>{authBusy ? "Verifying…" : "Verify email"}</span>
                        {!authBusy && <Icon name="arrow" size={17} />}
                      </button>
                      <button className="auth-resend" type="button" onClick={handleResendOtp} disabled={authBusy || !supabaseConfigured}>
                        {authBusy ? "Please wait…" : "Resend verification code"}
                      </button>
                    </>
                  )}
                </form>

                {authOtpStep ? (
                  <p className="auth-switch">
                    <span>Wrong email address?</span>
                    <button type="button" onClick={() => { setAuthOtpStep(false); setAuthOtp(""); setAuthMessage(""); }}>
                      Change email
                    </button>
                  </p>
                ) : (
                  <p className="auth-switch">
                    {authMode === "sign-up" ? "Already have an account?" : "New to Pilgrix?"}{" "}
                    <button type="button" onClick={() => { setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up"); setAuthOtpStep(false); setAuthOtp(""); setAuthMessage(""); setShowAuthPassword(false); }}>
                      {authMode === "sign-up" ? "Sign in" : "Create an account"}
                    </button>
                  </p>
                )}
                {!supabaseConfigured && <p className="auth-config-note">Account access is temporarily unavailable until the Supabase connection is configured.</p>}
                <div className="auth-main-footer"><Icon name="shield" size={14} /> Your workspace is private to your account.</div>
              </div>
            </div>
          </section>
        </div>
      )}
          </main>
  );
}
