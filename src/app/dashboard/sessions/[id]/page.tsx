import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";
import ClientPage from "./client-page";

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionId = params.id;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user data including role
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "counselor";

  // Get session details
  const { data: session } = await supabase
    .from("sessions")
    .select(
      `
      *,
      counselor:users!sessions_counselor_id_fkey(id, full_name, email),
      supervisor:users!sessions_supervisor_id_fkey(id, full_name, email)
    `,
    )
    .eq("id", sessionId)
    .single();

  if (!session) {
    return redirect("/dashboard/sessions");
  }

  // Check if user has access to this session
  if (userRole === "counselor" && session.counselor.id !== user.id) {
    return redirect("/dashboard/sessions");
  }

  // Get transcript and segments
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  const { data: segments } = transcript
    ? await supabase
        .from("transcript_segments")
        .select("*")
        .eq("transcript_id", transcript.id)
        .order("segment_index", { ascending: true })
    : { data: null };

  // Get comments
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:users(id, full_name, email),
      replies:comments(id, content, created_at, user_id, users(id, full_name, email))
    `,
    )
    .eq("session_id", sessionId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  return (
    <>
      <DashboardNavbar />
      <ClientPage
        sessionId={sessionId}
        session={session}
        userRole={userRole}
        transcript={transcript}
        segments={segments || []}
        comments={comments || []}
      />
    </>
  );
}
