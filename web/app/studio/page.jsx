import { redirect } from "next/navigation";
import StudioDashboard from "./StudioDashboard";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/");
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/");

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
      user={{ email: user.email, user_metadata: user.user_metadata }}
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
