"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { addCommentAction } from "@/app/actions";
import MarkAsReviewedButton from "@/components/mark-as-reviewed-button";
import AudioPlayerControls from "@/components/audio-player-controls";
import { FileAudio, User, UserCircle } from "lucide-react";
import SelectableTranscript from "@/components/selectable-transcript";

interface ClientPageProps {
  sessionId: string;
  session: any;
  userRole: string;
  transcript: any;
  segments: any[];
  comments: any[];
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  users?: {
    full_name: string;
  };
}

export default function ClientPage({
  sessionId,
  session,
  userRole,
  transcript,
  segments,
  comments,
}: ClientPageProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [showFixedPlayer, setShowFixedPlayer] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Handle scroll to determine when to show fixed player
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        const { top } = mainContentRef.current.getBoundingClientRect();
        setShowFixedPlayer(top < -200); // Show fixed player when audio section scrolls out of view
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle seeking in the audio
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // In a real implementation, this would control the actual audio playback
  };

  return (
    <main className="w-full bg-gray-50 min-h-screen pb-24">
      {/* Always show fixed player at bottom */}
      <div className="container mx-auto px-4 py-8">
        {/* Session Header */}
        <div className="bg-white rounded-xl p-6 border shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{session.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <UserCircle size={16} />
                  <span>{session.counselor.full_name}</span>
                </div>
                <div>
                  {typeof window === "undefined"
                    ? ""
                    : new Date(session.session_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <FileAudio size={16} />
                  <span>
                    {session.duration
                      ? `${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, "0")}`
                      : "Duration not available"}
                  </span>
                </div>
                <SessionStatus status={session.status} />
              </div>
            </div>
            {userRole === "supervisor" && session.status === "ready" && (
              <MarkAsReviewedButton sessionId={sessionId} />
            )}
          </div>
          {session.description && (
            <p className="mt-4 text-gray-600">{session.description}</p>
          )}
        </div>

        {/* Main Content */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          ref={mainContentRef}
        >
          {/* Audio Player and Transcript */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player removed from here - now only shown fixed at bottom */}

            {/* Transcript with selectable text */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Transcript</h2>

              {segments && segments.length > 0 ? (
                <SelectableTranscript
                  segments={segments}
                  sessionId={sessionId}
                  userRole={userRole}
                  comments={comments.filter((c) => c.segment_id)}
                />
              ) : session.status === "transcribing" ? (
                <div className="text-center py-12">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <p className="text-gray-500 mt-4">
                    Transcription in progress...
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No transcript available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* General Comments Section */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">General Feedback</h2>

            {comments && comments.filter((c) => !c.segment_id).length > 0 ? (
              <div className="space-y-6">
                {comments
                  .filter((c) => !c.segment_id)
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b pb-4 last:border-0"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-medium">
                            {comment.user.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {typeof window === "undefined"
                              ? ""
                              : new Date(comment.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {comment.start_time && comment.end_time && (
                        <div className="ml-11 mb-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                          {formatTimestamp(comment.start_time)} -{" "}
                          {formatTimestamp(comment.end_time)}
                        </div>
                      )}

                      <div className="ml-11 text-gray-800">
                        {comment.content}
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-11 mt-3 space-y-3">
                          {comment.replies.map((reply: Reply) => (
                            <div
                              key={reply.id}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
                                  <User size={12} />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {reply.users?.full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {typeof window === "undefined"
                                      ? ""
                                      : new Date(
                                          reply.created_at,
                                        ).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-8 text-sm text-gray-800">
                                {reply.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ml-11 mt-3">
                        <form action={addCommentAction} className="flex gap-2">
                          <input
                            type="hidden"
                            name="session_id"
                            value={sessionId}
                          />
                          <input
                            type="hidden"
                            name="parent_id"
                            value={comment.id}
                          />
                          <input
                            type="text"
                            name="content"
                            placeholder="Reply to this comment..."
                            className="flex-grow text-sm px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Reply
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No general feedback yet.{" "}
                  {userRole === "supervisor"
                    ? "Add the first comment!"
                    : "Your supervisor will provide feedback soon."}
                </p>
              </div>
            )}

            {userRole === "supervisor" && (
              <div className="mt-6 pt-6 border-t">
                <form action={addCommentAction} className="space-y-4">
                  <input type="hidden" name="session_id" value={sessionId} />
                  <textarea
                    name="content"
                    placeholder="Add your general feedback here..."
                    className="w-full p-3 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  ></textarea>
                  <Button type="submit" className="w-full">
                    Add General Comment
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Fixed Audio Player at bottom of viewport - always visible */}
      <AudioPlayerControls
        duration={session.duration}
        onSeek={handleSeek}
        isFixed={true}
      />
    </main>
  );
}

function SessionStatus({ status }: { status: string | null }) {
  let color = "bg-gray-100 text-gray-800";
  let label = status || "Unknown";

  switch (status) {
    case "pending":
      color = "bg-yellow-100 text-yellow-800";
      break;
    case "transcribing":
      color = "bg-blue-100 text-blue-800";
      label = "Processing";
      break;
    case "ready":
      color = "bg-green-100 text-green-800";
      break;
    case "reviewed":
      color = "bg-purple-100 text-purple-800";
      break;
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
