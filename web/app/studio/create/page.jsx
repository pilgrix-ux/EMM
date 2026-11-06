import { redirect } from "next/navigation";
import HomePage from "../../page";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudioCreatePage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/studio");
  }

  let claims = null;
  let authError = null;
  try {
    const result = await supabase.auth.getClaims();
    claims = result.data?.claims || null;
    authError = result.error || null;
  } catch (error) {
    authError = error;
  }

  const sessionMissing =
    authError?.name === "AuthSessionMissingError" ||
    authError?.message === "Auth session missing!";

  if (!claims?.sub) {
    if (!authError || sessionMissing) redirect("/");
    redirect("/studio");
  }

  return <HomePage workspaceOnly />;
}
