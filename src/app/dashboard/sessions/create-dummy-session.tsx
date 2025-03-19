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
          title: "Anxiety Management Counseling Session",
          description:
            "Initial session focusing on workplace anxiety and presentation fears",
          session_date: new Date().toISOString(),
          counselor_id: user.id,
          status: "ready",
          duration: 3600, // 1 hour
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
            "Counselor: Hello, how are you feeling today?\nClient: I've been feeling anxious lately, especially at work.\nCounselor: I see. Can you tell me more about what happens at work that triggers your anxiety?\nClient: Well, whenever I have to present in meetings, I feel my heart racing and I start to worry that I'll make a mistake or that people will judge me negatively.\nCounselor: That sounds challenging. It's common to feel anxious about public speaking. Have you noticed any physical symptoms besides the racing heart?\nClient: Yes, sometimes I get sweaty palms and feel a tightness in my chest. There are times when I worry it might be a panic attack coming on.\nCounselor: Thank you for sharing that. Let's talk about some techniques that might help you manage these feelings when they come up. Have you tried any relaxation techniques before?\nClient: I've tried deep breathing a few times, but I'm not sure if I'm doing it right. It doesn't seem to help much when I'm in the moment.\nCounselor: That's a good start. Deep breathing can be very effective, but it does take practice. Would you be open to trying a guided breathing exercise now?\nClient: Sure, I'm willing to try.\nCounselor: Great. Let's start by sitting comfortably and closing your eyes if that feels okay. Now, breathe in slowly through your nose for a count of four... hold for a count of two... and exhale through your mouth for a count of six. Let's try that a few times together.",
        })
        .select()
        .single();

      if (transcriptError) {
        throw new Error(
          `Failed to create transcript: ${transcriptError.message}`,
        );
      }

      // Create transcript segments for a 1-hour session with realistic timestamps
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
          text: "Well, whenever I have to present in meetings, I feel my heart racing and I start to worry that I'll make a mistake or that people will judge me negatively.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 4,
          start_time: 56.1,
          end_time: 75.4,
          text: "That sounds challenging. It's common to feel anxious about public speaking. Have you noticed any physical symptoms besides the racing heart?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 5,
          start_time: 76.2,
          end_time: 95.7,
          text: "Yes, sometimes I get sweaty palms and feel a tightness in my chest. There are times when I worry it might be a panic attack coming on.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 6,
          start_time: 96.5,
          end_time: 120.0,
          text: "Thank you for sharing that. Let's talk about some techniques that might help you manage these feelings when they come up. Have you tried any relaxation techniques before?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 7,
          start_time: 121.0,
          end_time: 145.5,
          text: "I've tried deep breathing a few times, but I'm not sure if I'm doing it right. It doesn't seem to help much when I'm in the moment.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 8,
          start_time: 146.2,
          end_time: 180.8,
          text: "That's a good start. Deep breathing can be very effective, but it does take practice. Would you be open to trying a guided breathing exercise now?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 9,
          start_time: 181.5,
          end_time: 185.2,
          text: "Sure, I'm willing to try.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 10,
          start_time: 186.0,
          end_time: 240.3,
          text: "Great. Let's start by sitting comfortably and closing your eyes if that feels okay. Now, breathe in slowly through your nose for a count of four... hold for a count of two... and exhale through your mouth for a count of six. Let's try that a few times together.",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 11,
          start_time: 300.0,
          end_time: 320.5,
          text: "How did that feel for you?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 12,
          start_time: 321.2,
          end_time: 350.8,
          text: "It was actually helpful. I feel a bit calmer now. I think I need to practice this more regularly though.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 13,
          start_time: 351.5,
          end_time: 400.2,
          text: "Absolutely. Regular practice is key. I'd recommend doing this exercise for 5 minutes each morning and evening. It can help build your capacity to use it when anxiety arises. Would you like to discuss some other techniques that might help with your presentation anxiety specifically?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 14,
          start_time: 401.0,
          end_time: 420.3,
          text: "Yes, that would be really helpful. I have a presentation next week that I'm already worried about.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 15,
          start_time: 421.5,
          end_time: 480.2,
          text: "Let's talk about preparation strategies then. Many people find that thorough preparation helps reduce anxiety. Could you tell me about your current approach to preparing for presentations?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 16,
          start_time: 481.0,
          end_time: 540.3,
          text: "I usually create my slides the night before and then try to memorize what I'm going to say. But I often feel underprepared, which makes me more nervous.",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 17,
          start_time: 541.5,
          end_time: 600.2,
          text: "I see. Starting earlier in the process might help reduce that last-minute pressure. What if you began preparing several days in advance and practiced your presentation multiple times? Research shows that repeated practice can significantly reduce performance anxiety.",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 18,
          start_time: 601.0,
          end_time: 630.3,
          text: "That makes sense. I could try that. Do you think I should practice in front of someone or just by myself?",
          speaker: "Client",
        },
        {
          transcript_id: transcript.id,
          segment_index: 19,
          start_time: 631.5,
          end_time: 690.2,
          text: "Both approaches have benefits. Practicing alone helps you become comfortable with the material, while practicing with a supportive friend or colleague can help simulate the actual presentation environment. Would you be comfortable trying both methods?",
          speaker: "Counselor",
        },
        {
          transcript_id: transcript.id,
          segment_index: 20,
          start_time: 691.0,
          end_time: 720.3,
          text: "I think I could do that. My roommate might be willing to listen to me practice.",
          speaker: "Client",
        },
      ];

      const { data: createdSegments, error: segmentsError } = await supabase
        .from("transcript_segments")
        .insert(segments)
        .select();

      if (segmentsError) {
        throw new Error(
          `Failed to create transcript segments: ${segmentsError.message}`,
        );
      }

      // Create sample comments with references to specific transcript segments
      if (!createdSegments || createdSegments.length === 0) {
        throw new Error("Failed to retrieve created segments");
      }

      const comments = [
        {
          session_id: session.id,
          user_id: user.id,
          content:
            "I notice you're experiencing anxiety during presentations. Let's explore some coping strategies that might help with this specific situation.",
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          segment_id: createdSegments[3].id,
          start_time: 36.0,
          end_time: 55.3,
        },
        {
          session_id: session.id,
          user_id: user.id,
          content:
            "Good job identifying the physical symptoms of anxiety. This awareness is an important first step in managing anxiety responses.",
          created_at: new Date(Date.now() - 72000000).toISOString(), // 20 hours ago
          segment_id: createdSegments[5].id,
          start_time: 76.2,
          end_time: 95.7,
        },
        {
          session_id: session.id,
          user_id: user.id,
          content:
            "I like how you introduced the breathing exercise here. Consider providing a handout with these instructions for the client to practice at home.",
          created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          segment_id: createdSegments[10].id,
          start_time: 186.0,
          end_time: 240.3,
        },
        {
          session_id: session.id,
          user_id: user.id,
          content:
            "Great suggestion about preparation strategies. You might also want to discuss visualization techniques in your next session.",
          created_at: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
          segment_id: createdSegments[17].id,
          start_time: 541.5,
          end_time: 600.2,
        },
        {
          session_id: session.id,
          user_id: user.id,
          content:
            "Overall, this was a productive session. You did a good job establishing rapport and addressing the client's immediate concerns about anxiety.",
          created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        },
      ];

      const { error: commentError } = await supabase
        .from("comments")
        .insert(comments);

      if (commentError) {
        throw new Error(`Failed to create comment: ${commentError.message}`);
      }

      // Redirect to the session detail page
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (error) {
      console.error("Error creating dummy session:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
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
