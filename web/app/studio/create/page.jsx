import HomePage from "../../page";

export const dynamic = "force-dynamic";

export default function StudioCreatePage() {
  // Keep this focused workspace route separate from the marketing entry point.
  // Private actions in HomePage still require the signed-in Supabase session.
  return <HomePage workspaceOnly />;
}
