// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TranscribeRequest {
  session_id: string;
  file_path: string;
}

interface TranscriptSegment {
  start_time: number;
  end_time: number;
  text: string;
  speaker: string;
  segment_index: number;
}

// Mock transcription function - in a real implementation, this would call an external API
async function mockTranscribeAudio(url: string): Promise<{
  full_text: string;
  segments: TranscriptSegment[];
}> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock transcript data
  const segments: TranscriptSegment[] = [
    {
      start_time: 0,
      end_time: 10.5,
      text: "Hello, how are you feeling today?",
      speaker: "Counselor",
      segment_index: 0,
    },
    {
      start_time: 11.2,
      end_time: 20.8,
      text: "I've been feeling anxious lately, especially at work.",
      speaker: "Client",
      segment_index: 1,
    },
    {
      start_time: 21.5,
      end_time: 35.2,
      text: "I see. Can you tell me more about what happens at work that triggers your anxiety?",
      speaker: "Counselor",
      segment_index: 2,
    },
    {
      start_time: 36.0,
      end_time: 55.3,
      text: "Well, whenever I have to present in meetings, I feel my heart racing and I start to worry that I'll make a mistake or that people will judge me negatively.",
      speaker: "Client",
      segment_index: 3,
    },
    {
      start_time: 56.1,
      end_time: 75.4,
      text: "That sounds challenging. It's common to feel anxious about public speaking. Have you noticed any physical symptoms besides the racing heart?",
      speaker: "Counselor",
      segment_index: 4,
    },
    {
      start_time: 76.2,
      end_time: 95.7,
      text: "Yes, sometimes I get sweaty palms and feel a tightness in my chest. There are times when I worry it might be a panic attack coming on.",
      speaker: "Client",
      segment_index: 5,
    },
    {
      start_time: 96.5,
      end_time: 120.0,
      text: "Thank you for sharing that. Let's talk about some techniques that might help you manage these feelings when they come up. Have you tried any relaxation techniques before?",
      speaker: "Counselor",
      segment_index: 6,
    },
  ];

  // Combine all segments into full text
  const full_text = segments
    .map((segment) => `${segment.speaker}: ${segment.text}`)
    .join("\n");

  return {
    full_text,
    segments,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get request body
    const { session_id, file_path } = (await req.json()) as TranscribeRequest;

    if (!session_id || !file_path) {
      return new Response(
        JSON.stringify({ error: "session_id and file_path are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Update session status to transcribing
    const { error: updateError } = await supabaseClient
      .from("sessions")
      .update({ status: "transcribing" })
      .eq("id", session_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Failed to update session status",
          details: updateError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Get the file URL
    const {
      data: { publicUrl },
    } = supabaseClient.storage
      .from("session-recordings")
      .getPublicUrl(file_path);

    // In a real implementation, call an external transcription API
    // For this demo, we'll use a mock function
    const { full_text, segments } = await mockTranscribeAudio(publicUrl);

    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabaseClient
      .from("transcripts")
      .insert({
        session_id,
        full_text,
      })
      .select()
      .single();

    if (transcriptError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create transcript",
          details: transcriptError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Insert transcript segments
    const segmentsWithTranscriptId = segments.map((segment) => ({
      ...segment,
      transcript_id: transcript.id,
    }));

    const { error: segmentsError } = await supabaseClient
      .from("transcript_segments")
      .insert(segmentsWithTranscriptId);

    if (segmentsError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create transcript segments",
          details: segmentsError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Update session status to ready
    const { error: finalUpdateError } = await supabaseClient
      .from("sessions")
      .update({ status: "ready" })
      .eq("id", session_id);

    if (finalUpdateError) {
      return new Response(
        JSON.stringify({
          error: "Failed to update session status",
          details: finalUpdateError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transcription completed successfully",
        transcript_id: transcript.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
