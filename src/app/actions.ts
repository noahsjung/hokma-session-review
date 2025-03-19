"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { Database } from "@/types/supabase";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const role =
    (formData
      .get("role")
      ?.toString() as Database["public"]["Enums"]["user_role"]) || "counselor";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
        role: role,
      },
    },
  });

  console.log("After signUp", error);

  if (error) {
    console.error(error instanceof Error ? error.code + " " + error.message : error);
    return encodedRedirect("error", "/sign-up", error instanceof Error ? error.message : "An unknown error occurred");
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        name: fullName,
        full_name: fullName,
        email: email,
        user_id: user.id,
        token_identifier: user.id,
        role: role,
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } catch (err) {
      console.error("Error in user profile creation:", err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error instanceof Error ? error.message : "An unknown error occurred");
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error instanceof Error ? error.message : error);
    return encodedRedirect("error", "/forgot-password", "Failed to send reset password link");
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// Session management actions
export const createSessionAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to create a session",
    );
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const sessionDate = formData.get("session_date") as string;
  const recordingFile = formData.get("recording") as File;

  if (!title || !sessionDate || !recordingFile) {
    return encodedRedirect(
      "error",
      "/dashboard/sessions/new",
      "Title, session date, and recording file are required",
    );
  }

  try {
    // Create session record first
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        title,
        description,
        session_date: new Date(sessionDate).toISOString(),
        counselor_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Upload the recording file
    const filePath = `${user.id}/${session.id}/${recordingFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("session-recordings")
      .upload(filePath, recordingFile);

    if (uploadError) {
      throw new Error(`Failed to upload recording: ${uploadError.message}`);
    }

    // Update session with recording URL
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ recording_url: filePath })
      .eq("id", session.id);

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    // Trigger transcription process
    const { error: transcriptionError } = await supabase.functions.invoke(
      "supabase-functions-transcribe-audio",
      {
        body: { session_id: session.id, file_path: filePath },
      },
    );

    if (transcriptionError) {
      throw new Error(
        `Failed to start transcription: ${transcriptionError.message}`,
      );
    }

    return redirect(`/dashboard/sessions/${session.id}`);
  } catch (error) {
    console.error("Error in session creation:", error);
    return encodedRedirect("error", "/dashboard/sessions/new", error instanceof Error ? error.message : "An unknown error occurred");
  }
};

export const addCommentAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "You must be logged in to add a comment",
    );
  }

  const sessionId = formData.get("session_id") as string;
  const segmentId = formData.get("segment_id") as string;
  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string;
  const startTime = formData.get("start_time")
    ? parseFloat(formData.get("start_time") as string)
    : null;
  const endTime = formData.get("end_time")
    ? parseFloat(formData.get("end_time") as string)
    : null;

  if (!sessionId || !content) {
    return encodedRedirect(
      "error",
      `/dashboard/sessions/${sessionId}`,
      "Session ID and comment content are required",
    );
  }

  try {
    const { error } = await supabase.from("comments").insert({
      session_id: sessionId,
      segment_id: segmentId || null,
      user_id: user.id,
      parent_id: parentId || null,
      content,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    return redirect(`/dashboard/sessions/${sessionId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    return encodedRedirect(
      "error",
      `/dashboard/sessions/${sessionId}`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
