import { redirect } from "next/navigation";
import StudioDashboard from "./StudioDashboard";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <StudioDashboard user={null} projects={[]} stats={{}} sessionError />;
  }

  // The root Proxy refreshes expiring cookie-backed sessions before this page
  // renders. Verify the resulting access token locally through its signed claims.
  let claims = null;
  let authError = null;
  try {
    const result = await supabase.auth.getClaims();
    claims = result.data?.claims || null;
    authError = result.error || null;
  } catch (error) {
    authError = error;
  }

  // No cookie-backed session is a real sign-in requirement. A different Auth
  // error may be temporary, so keep the user in Studio and let them retry.
  const sessionMissing =
    authError?.name === "AuthSessionMissingError" ||
    authError?.message === "Auth session missing!";

  if (!claims?.sub) {
    if (!authError || sessionMissing) redirect("/");
    return <StudioDashboard user={null} projects={[]} stats={{}} sessionError />;
  }

  const user = {
    id: claims.sub,
    email: claims.email,
    user_metadata: claims.user_metadata || {},
  };

  const [projectResult, totalResult, planResult, completedResult] = await Promise.all([
    supabase
      .from("ad_projects")
      .select("id, title, status, source_video_name, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("ad_projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("ad_projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["plan_ready", "approved", "rendering", "done", "complete"]),
    supabase
      .from("ad_projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["done", "complete"]),
  ]);

  return (
    <StudioDashboard
      user={user}
      projects={projectResult.data || []}
      stats={{
        total: totalResult.count ?? 0,
        plans: planResult.count ?? 0,
        completed: completedResult.count ?? 0,
      }}
      projectsError={Boolean(projectResult.error)}
    />
  );
}
