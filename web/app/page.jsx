import { redirect } from "next/navigation";
import HomePageClient from "./HomePageClient";
import { createClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let supabase;

  try {
    supabase = await createClient();
  } catch {
    return <HomePageClient />;
  }

  let isSignedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    isSignedIn = Boolean(data?.claims?.sub);
  } catch {
    // Keep the public entry page available when session verification is temporarily unavailable.
  }

  if (isSignedIn) {
    redirect("/studio");
  }

  return <HomePageClient />;
}
