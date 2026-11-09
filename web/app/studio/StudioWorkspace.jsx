"use client";

import { useEffect, useState } from "react";
import StudioDashboard from "./StudioDashboard";

export default function StudioWorkspace() {
  const [state, setState] = useState({
    loading: true,
    projects: [],
    stats: {},
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      try {
        const sessionResponse = await fetch("/api/workspace/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const session = await sessionResponse.json().catch(() => ({}));
        if (!sessionResponse.ok || !session?.visitorId) {
          throw new Error(session?.error || "Your private browser workspace could not start.");
        }

        const projectsResponse = await fetch("/api/workspace/projects", { cache: "no-store" });
        const result = await projectsResponse.json().catch(() => ({}));
        if (!projectsResponse.ok) {
          throw new Error(result?.error || "Your saved projects could not be loaded.");
        }

        if (!cancelled) {
          setState({
            loading: false,
            projects: Array.isArray(result.projects) ? result.projects : [],
            stats: result.stats || {},
            error: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ loading: false, projects: [], stats: {}, error: true });
        }
      }
    }

    loadWorkspace();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <main className="studio-page studio-page-refresh">
        <div className="studio-shell studio-shell-refresh">
          <div className="studio-v2-welcome">
            <div className="studio-v2-welcome-copy">
              <span className="studio-v2-eyebrow"><i /> YOUR CREATIVE WORKSPACE</span>
              <h1>Opening your workspace.</h1>
              <p>Preparing your private projects on this browser…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <StudioDashboard
      user={null}
      projects={state.projects}
      stats={state.stats}
      projectsError={state.error}
      sessionError={state.error}
    />
  );
}
