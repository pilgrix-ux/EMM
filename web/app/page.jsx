"use client";

import { useEffect, useRef, useState } from "react";

const initialBrief = {
  productName: "",
  benefit: "",
  audience: "",
  goal: "",
};

function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
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
    sparkle: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
    edit: <><path d="m15 5 4 4" /><path d="m4 20 4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return <svg {...common}>{paths[name] || paths.sparkle}</svg>;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export default function HomePage() {
  const fileInputRef = useRef(null);
  const videoSectionRef = useRef(null);
  const briefSectionRef = useRef(null);
  const homeRef = useRef(null);
  const videoElementRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [brief, setBrief] = useState(initialBrief);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!videoUrl) return undefined;
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  function openVideoPicker() {
    fileInputRef.current?.click();
  }

  function handleVideoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFormError("Choose a video file to continue.");
      event.target.value = "";
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(nextUrl);
    setVideoDuration("");
    setFormError("");
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoUrl("");
    setVideoDuration("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateBrief(field, value) {
    setBrief((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  }

  function jumpTo(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reviewBrief(event) {
    event.preventDefault();
    if (!videoFile) {
      setFormError("Add a source video before reviewing your brief.");
      jumpTo(videoSectionRef);
      return;
    }
    if (!brief.productName.trim()) {
      setFormError("Add the product or service name.");
      jumpTo(briefSectionRef);
      return;
    }
    if (!brief.benefit.trim()) {
      setFormError("Tell us what makes the product worth choosing.");
      jumpTo(briefSectionRef);
      return;
    }
    setFormError("");
    setReviewOpen(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden pb-32">
      <div className="ambient ambient-warm" />
      <div className="ambient ambient-lime" />

      <header className="topbar-wrap">
        <div className="topbar glass-panel">
          <a className="brand-lockup" href="#home" aria-label="EMM Ads Studio home">
            <span className="brand-mark">E</span>
            <span className="brand-copy">
              <strong>EMM Ads Studio</strong>
              <small>AI ADVERTISING WORKSPACE</small>
            </span>
          </a>
          <button className="button button-dark topbar-action" type="button" onClick={() => jumpTo(videoSectionRef)}>
            <Icon name="plus" size={15} />
            <span>New ad</span>
          </button>
        </div>
      </header>

      <div className="workspace" id="home" ref={homeRef}>
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CREATIVE WORKSPACE</div>
            <h1>
              Turn good footage
              <span className="headline-second">into <span className="headline-highlight">great ads.</span></span>
            </h1>
            <p className="hero-description">
              Start with your video. Tell us what makes your product worth choosing.
              EMM helps you shape a story people remember.
            </p>
            <div className="hero-actions">
              <button className="button button-lime" type="button" onClick={openVideoPicker}>
                Start with a video <Icon name="arrow" size={16} />
              </button>
              <button className="text-action" type="button" onClick={() => jumpTo(briefSectionRef)}>
                Explore the brief <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="hero-footnote">
              <span className="footnote-line" />
              <span>YOUR FOOTAGE. YOUR STORY. A STRONGER AD.</span>
            </div>
          </div>

          <aside className="manifesto-card">
            <div className="manifesto-top">
              <span>THE EMM APPROACH</span>
              <span className="manifesto-icon"><Icon name="sparkle" size={18} /></span>
            </div>
            <div className="manifesto-content">
              <span className="lime-kicker">FOOTAGE IN. STORY OUT.</span>
              <h2>Make every second of your ad count.</h2>
            </div>
            <div className="manifesto-bottom">
              <span>FROM PRODUCT TO IMPACT</span>
              <span>EMM STUDIO <span className="manifesto-arrow">↗</span></span>
            </div>
          </aside>
        </section>

        <section className="content-grid">
          <section className="surface-card video-card" ref={videoSectionRef} id="source-video">
            <div className="section-heading">
              <div>
                <div className="section-kicker">01 / SOURCE VIDEO</div>
                <h2>Start with your footage</h2>
                <p>Choose the clip you want to turn into an ad.</p>
              </div>
              <span className={`status-chip ${videoFile ? "status-ready" : ""}`}>
                <span className="status-dot" />
                {videoFile ? "VIDEO READY" : "NO CLIP"}
              </span>
            </div>

            <div className={`video-stage ${videoFile ? "video-stage-loaded" : ""}`}>
              {videoUrl ? (
                <>
                  <video
                    ref={videoElementRef}
                    className="video-player"
                    src={videoUrl}
                    controls
                    playsInline
                    onLoadedMetadata={(event) => setVideoDuration(formatDuration(event.currentTarget.duration))}
                  />
                  <div className="video-meta">
                    <div className="video-file-icon"><Icon name="film" size={15} /></div>
                    <div className="video-file-copy">
                      <strong title={videoFile.name}>{videoFile.name}</strong>
                      <span>{formatBytes(videoFile.size)}{videoDuration ? ` · ${videoDuration}` : ""}</span>
                    </div>
                    <button className="remove-button" type="button" onClick={removeVideo}>
                      <Icon name="close" size={14} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <div className="video-empty">
                  <div className="video-empty-icon"><Icon name="play" size={22} /></div>
                  <strong>Your video will appear here</strong>
                  <p>Select a product or service clip from your device to see it in the preview.</p>
                  <button className="button button-lime upload-button" type="button" onClick={openVideoPicker}>
                    <Icon name="plus" size={16} /> Choose video
                  </button>
                </div>
              )}
            </div>

            <div className="video-foot">
              <span><Icon name="shield" size={14} /> Previewed locally on this device</span>
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

          <section className="surface-card brief-card" ref={briefSectionRef} id="product-brief">
            <div className="section-heading brief-heading">
              <div>
                <div className="section-kicker">02 / PRODUCT BRIEF</div>
                <h2>Give your product a voice</h2>
                <p>A few clear details create a stronger starting point.</p>
              </div>
              <span className="brief-icon"><Icon name="edit" size={17} /></span>
            </div>

            <form className="brief-form" onSubmit={reviewBrief}>
              <label className="field-group">
                <span className="field-label">PRODUCT OR SERVICE NAME <b>*</b></span>
                <input
                  value={brief.productName}
                  onChange={(event) => updateBrief("productName", event.target.value)}
                  placeholder="e.g. Handmade leather bags"
                  autoComplete="off"
                  maxLength={120}
                />
              </label>

              <label className="field-group">
                <span className="field-label">WHAT MAKES IT WORTH CHOOSING? <b>*</b></span>
                <textarea
                  value={brief.benefit}
                  onChange={(event) => updateBrief("benefit", event.target.value)}
                  placeholder="Describe what you offer and the main benefit people get..."
                  maxLength={500}
                  rows={4}
                />
                <span className="field-counter">{brief.benefit.length} / 500</span>
              </label>

              <label className="field-group">
                <span className="field-label">WHO IS THIS FOR?</span>
                <input
                  value={brief.audience}
                  onChange={(event) => updateBrief("audience", event.target.value)}
                  placeholder="e.g. Students, busy parents"
                  autoComplete="off"
                  maxLength={120}
                />
              </label>

              <label className="field-group">
                <span className="field-label">WHAT SHOULD THE AD DO?</span>
                <input
                  value={brief.goal}
                  onChange={(event) => updateBrief("goal", event.target.value)}
                  placeholder="e.g. Get more enquiries"
                  autoComplete="off"
                  maxLength={160}
                />
              </label>

              {formError && <p className="form-error" role="alert">{formError}</p>}

              <div className="form-note">
                <span>Your brief gives the creative process a clear starting point.</span>
              </div>

              <button className="button button-dark review-button" type="submit">
                Review ad brief <Icon name="arrow" size={16} />
              </button>
            </form>
          </section>
        </section>

        <div className="prototype-note">
          <span className="prototype-pulse" />
          <span>WEB WORKSPACE PREVIEW</span>
          <i />
          <span>AI planning and video rendering are the next integrations</span>
        </div>
        <footer className="footer-line">
          <span>EMM ADS STUDIO</span>
          <span>CREATIVE STARTS HERE</span>
        </footer>
      </div>

      <nav className="floating-dock" aria-label="Primary navigation">
        <button className="dock-home" type="button" aria-label="Home" title="Home" onClick={() => jumpTo(homeRef)}>
          <Icon name="home" size={19} />
        </button>
      </nav>

      {reviewOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReviewOpen(false);
        }}>
          <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="modal-topline">
              <span className="section-kicker">BRIEF REVIEW</span>
              <button className="modal-close" type="button" aria-label="Close review" onClick={() => setReviewOpen(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal-success-icon"><Icon name="check" size={21} /></div>
            <h2 id="review-title">Your starting brief is ready.</h2>
            <p className="modal-intro">Here’s the information you’ve provided for this ad.</p>
            <div className="review-list">
              <div><span>Source video</span><strong>{videoFile?.name}</strong></div>
              <div><span>Product or service</span><strong>{brief.productName}</strong></div>
              <div><span>Main benefit</span><strong>{brief.benefit}</strong></div>
              <div><span>Audience</span><strong>{brief.audience || "Not specified"}</strong></div>
              <div><span>Ad objective</span><strong>{brief.goal || "Introduce the product or service"}</strong></div>
            </div>
            <div className="modal-honesty">
              <Icon name="sparkle" size={15} />
              <span>This is a local brief review. AI planning and video rendering are not connected yet.</span>
            </div>
            <button className="button button-dark review-button" type="button" onClick={() => setReviewOpen(false)}>
              Back to workspace <Icon name="arrow" size={16} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
