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

  const { data, error: projectsError } = await supabase
    .from("ad_projects")
    .select("id, title, status, source_video_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <StudioDashboard
      user={{ email: user.email, user_metadata: user.user_metadata }}
      projects={data || []}
      projectsError={Boolean(projectsError)}
    />
  );
}
