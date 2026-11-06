"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

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
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  };

  return <svg {...common}>{paths[name] || paths.film}</svg>;
}

function statusLabel(status) {
  return String(status || "draft").replaceAll("_", " ");
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

export default function StudioDashboard({ user, projects = [], projectsError = false }) {
  const [signingOut, setSigningOut] = useState(false);
  const displayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = displayName.split(/[ ._-]/)[0] || "there";
  const planCount = projects.filter((item) => ["plan_ready", "approved", "rendering", "done", "complete"].includes(item.status)).length;
  const completedCount = projects.filter((item) => ["done", "complete"].includes(item.status)).length;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.assign("/");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <main className="studio-page">
      <div className="studio-shell">
        <header className="studio-topbar">
          <a className="studio-brand" href="/studio" aria-label="Pilgrix Ads Studio workspace">
            <span className="studio-brand-mark">P</span>
            <span className="studio-brand-copy">
              <strong>Pilgrix Ads Studio</strong>
              <small>YOUR CREATIVE WORKSPACE</small>
            </span>
          </a>
          <div className="studio-top-actions">
            <span className="studio-user-chip" title={user?.email || ""}><i />{user?.email || "Signed in"}</span>
            <a className="button button-quiet" href="/">Public site</a>
            <button className="button button-quiet" type="button" onClick={handleSignOut} disabled={signingOut}>
              <Icon name="logout" size={14} />{signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>

        <div className="studio-main">
          <section className="studio-welcome">
            <div>
              <span className="studio-eyebrow"><i /> YOUR WORKSPACE</span>
              <h1>Welcome back, {firstName}.</h1>
              <p>Your next ad starts here. Pick up a saved project or create something new from the footage you already have.</p>
            </div>
            <a className="button button-dark studio-primary-action" href="/#source-video">
              <Icon name="plus" size={16} /> Create a new ad <Icon name="arrow" size={15} />
            </a>
          </section>

          <section className="studio-overview-grid" aria-label="Workspace overview">
            <article className="studio-stat-card">
              <span className="studio-stat-icon"><Icon name="folder" size={18} /></span>
              <span className="studio-stat-copy"><span>Total projects</span><strong>{projects.length}</strong></span>
            </article>
            <article className="studio-stat-card">
              <span className="studio-stat-icon"><Icon name="clock" size={18} /></span>
              <span className="studio-stat-copy"><span>Plans prepared</span><strong>{planCount}</strong></span>
            </article>
            <article className="studio-stat-card">
              <span className="studio-stat-icon"><Icon name="check" size={18} /></span>
              <span className="studio-stat-copy"><span>Completed videos</span><strong>{completedCount}</strong></span>
            </article>
          </section>

          <div className="studio-content-grid">
            <section className="studio-panel">
              <div className="studio-panel-heading">
                <div>
                  <span className="section-kicker">YOUR PROJECTS</span>
                  <h2>Recent work</h2>
                  <p>Your saved ads and creative plans, kept in your private workspace.</p>
                </div>
                <span className="studio-count-chip">{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
              </div>

              {projectsError ? (
                <div className="studio-empty-state">
                  <span className="studio-empty-icon"><Icon name="folder" size={22} /></span>
                  <h3>Projects couldn’t load.</h3>
                  <p>Your account is signed in, but the project list is temporarily unavailable. Refresh this page to try again.</p>
                </div>
              ) : projects.length ? (
                <div className="studio-project-list">
                  {projects.map((project) => (
                    <article className="studio-project-card" key={project.id}>
                      <span className="studio-project-thumb"><Icon name="film" size={19} /></span>
                      <span className="studio-project-copy">
                        <strong title={project.title}>{project.title || "Untitled ad"}</strong>
                        <small>{project.source_video_name || "Source video"} · Updated {formatDate(project.created_at)}</small>
                      </span>
                      <span className={"studio-project-status status-" + (project.status || "draft").replaceAll("_", "_")}>{statusLabel(project.status)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="studio-empty-state">
                  <span className="studio-empty-icon"><Icon name="film" size={23} /></span>
                  <h3>Your first ad starts with a video.</h3>
                  <p>Upload a product clip, add a few details and let Pilgrix help shape the story. Your saved work will appear here.</p>
                  <a className="button button-lime" href="/#source-video"><Icon name="plus" size={15} /> Create your first ad</a>
                </div>
              )}
            </section>

            <aside className="studio-side-stack">
              <section className="studio-create-card">
                <span className="studio-create-kicker">READY WHEN YOU ARE</span>
                <h2>Make something worth watching.</h2>
                <p>Start from your own footage. Shape the message, review the scenes and render the final edit.</p>
                <a className="button button-lime" href="/#source-video">Start a new ad <Icon name="arrow" size={15} /></a>
              </section>

              <section className="studio-panel studio-steps-card">
                <span className="section-kicker">HOW PILGRIX WORKS</span>
                <div className="studio-steps-list">
                  <div><span>01</span><strong>Upload your footage</strong><small>Choose a clip from your device.</small></div>
                  <div><span>02</span><strong>Build your ad plan</strong><small>Set the product, audience and style.</small></div>
                  <div><span>03</span><strong>Review and render</strong><small>Approve the creative before export.</small></div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="studio-footer">
          <span>PILGRIX ADS STUDIO</span>
          <span>YOUR FOOTAGE. YOUR CREATIVE CONTROL.</span>
        </footer>
      </div>
    </main>
  );
}
