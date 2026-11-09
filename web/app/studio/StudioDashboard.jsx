"use client";

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    film: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 19v1h16v-1" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
  };

  return <svg {...common}>{paths[name] || paths.film}</svg>;
}

function normalizeStatus(status) {
  return String(status || "draft").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);
  const labels = {
    plan_ready: "Plan ready",
    approved: "Approved",
    rendering: "Rendering",
    done: "Completed",
    complete: "Completed",
    failed: "Needs attention",
    error: "Needs attention",
  };

  return labels[normalized] || normalized.replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function StudioDashboard({ user, projects = [], stats = {}, projectsError = false, sessionError = false }) {
  const displayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Creator";
  const firstName = displayName.split(/[ ._-]/)[0] || "there";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "P";
  const totalCount = Number.isFinite(stats.total) ? stats.total : projects.length;
  const planCount = Number.isFinite(stats.plans) ? stats.plans : 0;
  const completedCount = Number.isFinite(stats.completed) ? stats.completed : 0;

  return (
    <main className="studio-page studio-page-refresh">
      <div className="studio-shell studio-shell-refresh">
        <header className="studio-v2-topbar">
          <a className="studio-v2-brand" href="/studio/create" aria-label="Pilgrix Ads Studio workspace">
            <span className="studio-v2-brand-mark">P</span>
            <span className="studio-v2-brand-copy">
              <strong>Pilgrix</strong>
              <small>ADS STUDIO</small>
            </span>
          </a>

          <div className="studio-v2-actions" aria-label="Private browser workspace">
            <span className="studio-v2-user-chip" title={user?.email || "Saved on this browser"}>
              <span className="studio-v2-user-avatar" aria-hidden="true">{initials}</span>
              <span className="studio-v2-user-label">{sessionError ? "Workspace unavailable" : user?.email || "This browser"}</span>
            </span>
          </div>
        </header>

        <div className="studio-v2-main">
          <section className="studio-v2-welcome">
            <div className="studio-v2-welcome-copy">
              <span className="studio-v2-eyebrow"><i /> YOUR CREATIVE WORKSPACE</span>
              <h1>{sessionError ? "Reconnecting your workspace." : user ? `Welcome back, ${firstName}.` : "Your creative workspace."}</h1>
              <p>{sessionError ? "We couldn’t open your private browser workspace. Check your connection and try again." : user ? "Bring your next idea to life. Pick up where you left off or turn a fresh video into an ad worth watching." : "Build your ad, review every edit and come back to your saved work on this browser."}</p>
            </div>
          </section>

          {!sessionError && <section className="studio-v2-overview" aria-label="Workspace overview">
            <article className="studio-v2-stat-card">
              <span className="studio-v2-stat-icon"><Icon name="folder" size={18} /></span>
              <span className="studio-v2-stat-copy">
                <span>Total projects</span>
                <strong>{totalCount}</strong>
                <small>Saved to your workspace</small>
              </span>
            </article>
            <article className="studio-v2-stat-card">
              <span className="studio-v2-stat-icon"><Icon name="layers" size={18} /></span>
              <span className="studio-v2-stat-copy">
                <span>Plans prepared</span>
                <strong>{planCount}</strong>
                <small>Ready for the next step</small>
              </span>
            </article>
            <article className="studio-v2-stat-card">
              <span className="studio-v2-stat-icon"><Icon name="check" size={18} /></span>
              <span className="studio-v2-stat-copy">
                <span>Completed videos</span>
                <strong>{completedCount}</strong>
                <small>Finished creative exports</small>
              </span>
            </article>
          </section>}

          <div className="studio-v2-content-grid">
            <section className="studio-v2-panel studio-v2-projects-panel" aria-label="Recent projects">
              <div className="studio-v2-panel-heading">
                <div>
                  <span className="studio-v2-section-kicker">YOUR LIBRARY</span>
                  <h2>Recent projects</h2>
                  <p>Your latest saved ads and creative plans.</p>
                </div>
                <span className="studio-v2-count-chip">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </span>
              </div>

              {projectsError || sessionError ? (
                <div className="studio-v2-empty studio-v2-empty-error" role="alert">
                  <span className="studio-v2-empty-icon"><Icon name="folder" size={22} /></span>
                  <h3>{sessionError ? "We couldn’t open your browser workspace just now." : "We couldn’t load your projects."}</h3>
                  <p>{sessionError ? "Your saved work is still attached to this browser. Check your connection and retry the workspace." : "Your private workspace is still available. Refresh to try loading your saved work again."}</p>
                  <a className="button button-quiet studio-v2-retry-button" href="/studio">{sessionError ? "Retry workspace" : "Refresh projects"}</a>
                </div>
              ) : projects.length ? (
                <div className="studio-v2-project-list">
                  {projects.map((project) => {
                    const status = normalizeStatus(project.status);
                    return (
                      <article className="studio-v2-project-row" key={project.id}>
                        <span className="studio-v2-project-thumb"><Icon name="film" size={19} /></span>
                        <span className="studio-v2-project-copy">
                          <strong title={project.title || "Untitled ad"}>{project.title || "Untitled ad"}</strong>
                          <small>
                            <span>{project.source_video_name || "Source video"}</span>
                            <i aria-hidden="true">·</i>
                            <span>Updated {formatDate(project.updated_at || project.created_at)}</span>
                          </small>
                        </span>
                        <span className={"studio-v2-status studio-v2-status--" + status}>
                          <i aria-hidden="true" />
                          {statusLabel(project.status)}
                        </span>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="studio-v2-empty">
                  <span className="studio-v2-empty-icon"><Icon name="film" size={22} /></span>
                  <h3>Your first ad starts with an idea.</h3>
                  <p>Upload a product clip, add a few details and shape it into a polished creative. Your saved work will appear here.</p>
                  
                </div>
              )}
            </section>

            <aside className="studio-v2-side-stack">
              <section className="studio-v2-create-card">
                <span className="studio-v2-create-orbit" aria-hidden="true"><Icon name="spark" size={19} /></span>
                <span className="studio-v2-create-kicker">MAKE YOUR NEXT MOVE</span>
                <h2>Good ideas deserve great ads.</h2>
                <p>Start with your footage or a simple idea. Shape the story, review the plan and make an ad worth watching.</p>
                <a className="studio-v2-create-action" href="/studio/create"><Icon name="plus" size={15} /> Create an ad <Icon name="arrow" size={14} /></a>
                <span className="studio-v2-create-note"><Icon name="upload" size={13} /> Video or idea — you choose</span>
              </section>

              <section className="studio-v2-panel studio-v2-steps-panel">
                <div className="studio-v2-panel-heading studio-v2-steps-heading">
                  <div>
                    <span className="studio-v2-section-kicker">A SIMPLE WORKFLOW</span>
                    <h2>From clip to creative</h2>
                  </div>
                </div>
                <div className="studio-v2-steps-list">
                  <div>
                    <span>01</span>
                    <div><strong>Upload your footage</strong><small>Choose a clip from your device.</small></div>
                  </div>
                  <div>
                    <span>02</span>
                    <div><strong>Build your ad plan</strong><small>Set your product, audience and style.</small></div>
                  </div>
                  <div>
                    <span>03</span>
                    <div><strong>Review and render</strong><small>Approve your creative before export.</small></div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="studio-v2-footer">
          <span>PILGRIX ADS STUDIO</span>
          <span>YOUR FOOTAGE. YOUR CREATIVE CONTROL.</span>
        </footer>
      </div>
    </main>
  );
}
