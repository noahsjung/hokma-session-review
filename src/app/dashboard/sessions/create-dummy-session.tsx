"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";

export default function CreateDummySession() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createDummySession = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a session");
      }

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          title: "Mock Counseling Session",
          description: "This is a dummy session for testing purposes",
          session_date: new Date().toISOString(),
          counselor_id: user.id,
          status: "ready",
          duration: 125, // 2:05 minutes
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Create transcript record
      const { data: transcript, error: transcriptError } = await supabase
        .from("transcripts")
        .insert({
          session_id: session.id,
          full_text:
            "Counselor: Hello, how are you feeling today?\nClient: I've been feeling anxious lately, especially at work.\nCounselor: I see. Can you tell me more about what happens at work that triggers your anxiety?\nClient: Well, whenever I have to present in meetings, I feel my heart racing and I start to worry that I'll make a mistake.",
        })
        .select()
        .single();

      if (transcriptError) {
        throw new Error(
          `Failed to create transcript: ${transcriptError.message}`,
        );
      }

      // Create transcript segments
      const segments = [
        {
          transcript_id: transcript.id,
          segment_index: 0,
          start_time: 0,
          end_time: 10.5,
          text: "Hello, how are you feeling today?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 1,
          start_time: 11.2,
          end_time: 20.8,
          text: "I've been feeling anxious lately, especially at work.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 2,
          start_time: 21.5,
          end_time: 35.2,
          text: "I see. Can you tell me more about what happens at work that triggers your anxiety?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 3,
          start_time: 36.0,
          end_time: 55.3,
          text: "Well, whenever I have to present in meetings, I feel my heart racing and I start to worry that I'll make a mistake.",
          speaker: "Client",
        },
      ];

      const { error: segmentsError } = await supabase
        .from("transcript_segments")
        .insert(segments);

      if (segmentsError) {
        throw new Error(
          `Failed to create transcript segments: ${segmentsError.message}`,
        );
      }

      // Create a sample comment
      const { error: commentError } = await supabase.from("comments").insert({
        session_id: session.id,
        user_id: user.id,
        content:
          "I notice you're experiencing anxiety during presentations. Let's explore some coping strategies that might help with this specific situation.",
        created_at: new Date().toISOString(),
      });

      if (commentError) {
        throw new Error(`Failed to create comment: ${commentError.message}`);
      }

      // Redirect to the session detail page
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (error) {
      console.error("Error creating dummy session:", error);
      setError(error.message);
      setIsCreating(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-xl p-6 border shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Create Dummy Session</h1>
            <p className="text-gray-600 mb-6">
              This will create a mock counseling session with transcript data
              for testing purposes.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            <Button
              onClick={createDummySession}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Dummy Session"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
