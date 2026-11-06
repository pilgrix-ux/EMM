import { redirect } from "next/navigation";
import HomePageClient from "./HomePageClient";
import { createClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let signedIn = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  } catch {
    // Keep the public landing page available if auth verification is temporarily unavailable.
  }

  if (signedIn) {
    redirect("/studio");
  }

  return <HomePageClient />;
}
