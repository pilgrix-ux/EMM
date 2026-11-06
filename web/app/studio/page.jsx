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

  // Verify the cookie-backed access token without an additional Auth user lookup.
  // The root Proxy refreshes expiring sessions and forwards updated cookies here.
  const { data: { claims } = {}, error: authError } = await supabase.auth.getClaims();

  // A transient verification/network failure must not look like a sign-out.
  // Keep the user on the workspace and let them retry instead of redirecting to "/".
  if (authError) {
    return <StudioDashboard user={null} projects={[]} stats={{}} sessionError />;
  }

  if (!claims?.sub) redirect("/");

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
