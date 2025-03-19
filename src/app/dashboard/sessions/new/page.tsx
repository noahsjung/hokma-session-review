import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";
import { createSessionAction } from "@/app/actions";
import SessionUploadForm from "./session-upload-form";

export default async function NewSessionPage() {
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

  // If user is not a counselor, redirect to dashboard
  if (userData?.role !== "counselor") {
    return redirect("/dashboard");
  }

  return (
    <main className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Upload New Session</h1>
            <p className="text-gray-600 mt-1">
              Upload a counseling session recording to receive feedback from
              your supervisor.
            </p>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <SessionUploadForm createSessionAction={createSessionAction} />
          </div>
        </div>
      </div>
    </main>
  );
}
