"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  addCommentAction,
  editCommentAction,
  deleteCommentAction,
} from "@/app/actions";
import MarkAsReviewedButton from "@/components/mark-as-reviewed-button";
import AudioPlayerControls from "@/components/audio-player-controls";
import {
  FileAudio,
  User,
  UserCircle,
  Edit,
  Trash,
  MessageSquare,
  Clock,
  Mic,
  Volume2,
} from "lucide-react";
import SelectableTranscript from "@/components/selectable-transcript";
import AudioRecorder from "@/components/audio-recorder";
import AudioFeedbackPlayer from "@/components/audio-feedback-player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  user_id?: string;
  users?: {
    id: string;
    full_name: string;
  };
  has_audio?: boolean;
  audio_url?: string;
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
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showTimestampCommentForm, setShowTimestampCommentForm] =
    useState(false);
  const [commentType, setCommentType] = useState<"text" | "audio">("text");
  const [audioFeedbackBlob, setAudioFeedbackBlob] = useState<Blob | null>(null);
  const [editingAudioComment, setEditingAudioComment] = useState<string | null>(
    null,
  );
  const [currentSegmentId, setCurrentSegmentId] = useState<string | null>(null);
  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const mainContentRef = useRef<HTMLDivElement>(null);
  const userId = session?.counselor?.id || "";
  const hasAudio = true; // Force audio player to show for debugging
  console.log("Session recording URL:", session.recording_url);
  const hasTranscript = transcript && segments && segments.length > 0;

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

    // Find and highlight the segment at this time
    if (segments && segments.length > 0) {
      const segment = segments.find(
        (seg) => time >= seg.start_time && time <= seg.end_time,
      );

      if (segment) {
        setCurrentSegmentId(segment.id);
      }
    }
  };

  // Find the current segment based on playback time
  useEffect(() => {
    if (!segments || segments.length === 0) return;

    const currentSegment = segments.find(
      (segment) =>
        currentTime >= segment.start_time && currentTime <= segment.end_time,
    );

    // If no segment matches exactly, find the closest upcoming segment
    if (!currentSegment && currentTime > 0) {
      const upcomingSegments = segments.filter(
        (segment) => segment.start_time > currentTime,
      );
      if (upcomingSegments.length > 0) {
        // Sort by start time and get the closest one
        const closestSegment = upcomingSegments.sort(
          (a, b) => a.start_time - b.start_time,
        )[0];
        if (closestSegment && closestSegment.id !== currentSegmentId) {
          setCurrentSegmentId(closestSegment.id);
        }
      }
    } else if (currentSegment && currentSegment.id !== currentSegmentId) {
      setCurrentSegmentId(currentSegment.id);

      // Scroll to the current segment, positioning it at the top 1/3 of the viewport
      const segmentElement = segmentRefs.current[currentSegment.id];
      if (segmentElement) {
        // Calculate viewport height and desired offset (1/3 from the top)
        const viewportHeight = window.innerHeight;
        const offsetFromTop = viewportHeight / 3;

        // Get the element's position
        const rect = segmentElement.getBoundingClientRect();

        // Calculate the scroll position to place the element at 1/3 from the top
        const scrollPosition = window.pageYOffset + rect.top - offsetFromTop;

        // Scroll to the calculated position
        window.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [currentTime, segments, currentSegmentId]);

  const handleAddTimestampComment = () => {
    setShowTimestampCommentForm(true);
  };

  const handleCancelTimestampComment = () => {
    setShowTimestampCommentForm(false);
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  return (
    <main className="w-full bg-gray-50 min-h-screen pb-24">
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
                <div suppressHydrationWarning>
                  {new Date(session.session_date).toLocaleDateString()}
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
        <div className="grid grid-cols-1 gap-6" ref={mainContentRef}>
          {/* Audio Player and Transcript */}
          <div className="space-y-6">
            {/* Transcript with selectable text or Audio Timeline */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Transcript</h2>

              {hasTranscript ? (
                <>
                  <p className="mb-4 text-sm text-gray-500">
                    {segments.length} segments found
                  </p>
                  <SelectableTranscript
                    segments={segments}
                    sessionId={sessionId}
                    userRole={userRole}
                    comments={comments.filter((c) => c.segment_id)}
                    userId={userId}
                    currentSegmentId={currentSegmentId}
                    segmentRefs={segmentRefs}
                  />
                </>
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
              ) : hasAudio ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500">
                      <p>No transcript available for this session.</p>
                      <p className="text-sm mt-1">
                        You can still leave feedback at specific timestamps.
                      </p>
                    </div>
                    {userRole === "supervisor" && !showTimestampCommentForm && (
                      <Button
                        onClick={handleAddTimestampComment}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        <span>Comment at {formatTimestamp(currentTime)}</span>
                      </Button>
                    )}
                  </div>

                  {/* Audio Timeline Visualization */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">
                        Audio Timeline
                      </span>
                    </div>
                    <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-200"
                        style={{
                          width: `${(currentTime / (session.duration || 3600)) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="absolute top-0 w-1 h-full bg-blue-600"
                        style={{
                          left: `${(currentTime / (session.duration || 3600)) * 100}%`,
                        }}
                      ></div>

                      {/* Display timestamp comments on timeline */}
                      {comments
                        .filter((c) => c.start_time && !c.segment_id)
                        .map((comment) => (
                          <div
                            key={comment.id}
                            className="absolute top-0 w-1 h-full bg-red-500 cursor-pointer hover:bg-red-600"
                            style={{
                              left: `${(comment.start_time / (session.duration || 3600)) * 100}%`,
                            }}
                            title={`Comment at ${formatTimestamp(comment.start_time)}`}
                          ></div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0:00</span>
                      <span>{formatTimestamp(session.duration || 3600)}</span>
                    </div>
                  </div>

                  {/* Timestamp Comment Form */}
                  {showTimestampCommentForm && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <form
                        action={async (formData) => {
                          if (audioFeedbackBlob) {
                            formData.append(
                              "audio_feedback",
                              audioFeedbackBlob,
                            );
                          }
                          const result = await addCommentAction(formData);
                          if (result?.redirectUrl) {
                            setShowTimestampCommentForm(false);
                            setAudioFeedbackBlob(null);
                            setCommentType("text");
                            window.location.href = result.redirectUrl;
                          }
                        }}
                        className="space-y-3"
                      >
                        <input
                          type="hidden"
                          name="session_id"
                          value={sessionId}
                        />
                        <input
                          type="hidden"
                          name="start_time"
                          value={currentTime}
                        />
                        <input
                          type="hidden"
                          name="end_time"
                          value={currentTime + 5}
                        />
                        {audioFeedbackBlob && (
                          <input
                            type="hidden"
                            name="has_audio_feedback"
                            value="true"
                          />
                        )}

                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Clock size={16} />
                          <span>
                            Adding comment at timestamp:{" "}
                            {formatTimestamp(currentTime)}
                          </span>
                        </div>

                        <Tabs
                          defaultValue="text"
                          className="w-full"
                          onValueChange={(value) =>
                            setCommentType(value as "text" | "audio")
                          }
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger
                              value="text"
                              className="flex items-center gap-2"
                            >
                              <MessageSquare size={16} />
                              Text Feedback
                            </TabsTrigger>
                            <TabsTrigger
                              value="audio"
                              className="flex items-center gap-2"
                            >
                              <Mic size={16} />
                              Audio Feedback
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="text" className="mt-4">
                            <textarea
                              name="content"
                              placeholder="Add your feedback for this timestamp..."
                              className="w-full p-3 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={commentType === "text"}
                              autoFocus
                            ></textarea>
                          </TabsContent>
                          <TabsContent value="audio" className="mt-4">
                            <AudioRecorder
                              onRecordingComplete={(blob) =>
                                setAudioFeedbackBlob(blob)
                              }
                            />
                            <input
                              type="hidden"
                              name="content"
                              value={
                                commentType === "audio"
                                  ? "[Audio Feedback]"
                                  : ""
                              }
                            />
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelTimestampComment}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              commentType === "audio" && !audioFeedbackBlob
                            }
                          >
                            Add Comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Display Timestamp Comments */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Timestamp Comments</h3>
                    {comments.filter((c) => !c.segment_id && c.start_time)
                      .length > 0 ? (
                      <div className="space-y-4">
                        {comments
                          .filter((c) => !c.segment_id && c.start_time)
                          .sort(
                            (a, b) => (a.start_time || 0) - (b.start_time || 0),
                          )
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-3">
                                  <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center">
                                    <User size={16} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {comment.user?.full_name}
                                    </div>
                                    <div
                                      className="text-xs text-gray-500"
                                      suppressHydrationWarning
                                    >
                                      {comment.created_at
                                        ? new Date(
                                            comment.created_at,
                                          ).toLocaleString()
                                        : ""}
                                    </div>
                                  </div>
                                </div>

                                {userRole === "supervisor" &&
                                  comment.user?.id === userId &&
                                  !editingComment && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          handleEditComment(comment)
                                        }
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              "Are you sure you want to delete this comment?",
                                            )
                                          ) {
                                            const formData = new FormData();
                                            formData.append(
                                              "comment_id",
                                              comment.id,
                                            );
                                            formData.append(
                                              "session_id",
                                              sessionId,
                                            );
                                            deleteCommentAction(formData).then(
                                              (result) => {
                                                if (result?.redirectUrl) {
                                                  window.location.href =
                                                    result.redirectUrl;
                                                }
                                              },
                                            );
                                          }
                                        }}
                                      >
                                        <Trash size={14} />
                                      </Button>
                                    </div>
                                  )}
                              </div>

                              <div className="ml-11 mb-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                                Timestamp:{" "}
                                {formatTimestamp(comment.start_time || 0)}
                              </div>

                              {editingComment === comment.id ? (
                                <div className="ml-11">
                                  <form
                                    action={async (formData) => {
                                      if (
                                        comment.has_audio &&
                                        audioFeedbackBlob
                                      ) {
                                        formData.append(
                                          "audio_feedback",
                                          audioFeedbackBlob,
                                        );
                                        formData.append(
                                          "has_audio_feedback",
                                          "true",
                                        );
                                      }
                                      const result =
                                        await editCommentAction(formData);
                                      if (result?.redirectUrl) {
                                        window.location.href =
                                          result.redirectUrl;
                                      }
                                    }}
                                    className="space-y-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="comment_id"
                                      value={comment.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="session_id"
                                      value={sessionId}
                                    />

                                    {comment.has_audio ? (
                                      <div className="space-y-3">
                                        <div className="text-sm text-gray-600">
                                          Re-record your audio feedback:
                                        </div>
                                        <AudioRecorder
                                          onRecordingComplete={(blob) =>
                                            setAudioFeedbackBlob(blob)
                                          }
                                          initialAudioUrl={
                                            comment.audio_url || undefined
                                          }
                                        />
                                        <input
                                          type="hidden"
                                          name="content"
                                          value="[Audio Feedback]"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            size="sm"
                                            disabled={!audioFeedbackBlob}
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <textarea
                                          name="content"
                                          value={editContent}
                                          onChange={(e) =>
                                            setEditContent(e.target.value)
                                          }
                                          className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        ></textarea>
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            Cancel
                                          </Button>
                                          <Button type="submit" size="sm">
                                            Save
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </form>
                                </div>
                              ) : (
                                <div className="ml-11">
                                  {comment.has_audio ? (
                                    <div className="space-y-2">
                                      <div className="text-sm text-gray-600 flex items-center gap-1">
                                        <Volume2 size={14} />
                                        <span>Audio Feedback</span>
                                      </div>
                                      <AudioFeedbackPlayer
                                        audioUrl={comment.audio_url || ""}
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-gray-800">
                                      {comment.content}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No timestamp comments yet.</p>
                        <p className="text-sm mt-1">
                          Use the button above to add a comment at the current
                          timestamp.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No transcript or audio available yet.</p>
                  <p className="mt-2 text-sm">
                    {transcript
                      ? "Transcript exists but no segments found."
                      : "No transcript found for this session."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* General Comments Section */}
          <div className="bg-white rounded-xl p-6 border shadow-sm mt-6">
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
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-medium">
                              {comment.user.full_name}
                            </div>
                            <div
                              className="text-xs text-gray-500"
                              suppressHydrationWarning
                            >
                              {comment.created_at
                                ? new Date(comment.created_at).toLocaleString()
                                : ""}
                            </div>
                          </div>
                        </div>

                        {comment.user?.id === userId && !editingComment && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditComment(comment)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this comment?",
                                  )
                                ) {
                                  const formData = new FormData();
                                  formData.append("comment_id", comment.id);
                                  formData.append("session_id", sessionId);
                                  deleteCommentAction(formData).then(
                                    (result) => {
                                      if (result?.redirectUrl) {
                                        window.location.href =
                                          result.redirectUrl;
                                      }
                                    },
                                  );
                                }
                              }}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        )}
                      </div>

                      {comment.start_time && comment.end_time && (
                        <div className="ml-11 mb-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                          {formatTimestamp(comment.start_time)} -{" "}
                          {formatTimestamp(comment.end_time)}
                        </div>
                      )}

                      {editingComment === comment.id ? (
                        <div className="ml-11">
                          <form
                            action={async (formData) => {
                              if (comment.has_audio && audioFeedbackBlob) {
                                formData.append(
                                  "audio_feedback",
                                  audioFeedbackBlob,
                                );
                                formData.append("has_audio_feedback", "true");
                              }
                              const result = await editCommentAction(formData);
                              if (result?.redirectUrl) {
                                window.location.href = result.redirectUrl;
                              }
                            }}
                            className="space-y-3"
                          >
                            <input
                              type="hidden"
                              name="comment_id"
                              value={comment.id}
                            />
                            <input
                              type="hidden"
                              name="session_id"
                              value={sessionId}
                            />

                            {comment.has_audio ? (
                              <div className="space-y-3">
                                <div className="text-sm text-gray-600">
                                  Re-record your audio feedback:
                                </div>
                                <AudioRecorder
                                  onRecordingComplete={(blob) =>
                                    setAudioFeedbackBlob(blob)
                                  }
                                  initialAudioUrl={
                                    comment.audio_url || undefined
                                  }
                                />
                                <input
                                  type="hidden"
                                  name="content"
                                  value="[Audio Feedback]"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!audioFeedbackBlob}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <textarea
                                  name="content"
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                ></textarea>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" size="sm">
                                    Save
                                  </Button>
                                </div>
                              </>
                            )}
                          </form>
                        </div>
                      ) : (
                        <div className="ml-11">
                          {comment.has_audio ? (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Volume2 size={14} />
                                <span>Audio Feedback</span>
                              </div>
                              <AudioFeedbackPlayer
                                audioUrl={comment.audio_url || ""}
                              />
                            </div>
                          ) : (
                            <div className="text-gray-800">
                              {comment.content}
                            </div>
                          )}
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-11 mt-3 space-y-3">
                          {comment.replies.map((reply: Reply) => (
                            <div
                              key={reply.id}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-start gap-2">
                                  <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
                                    <User size={12} />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {reply.users?.full_name}
                                    </div>
                                    <div
                                      className="text-xs text-gray-500"
                                      suppressHydrationWarning
                                    >
                                      {reply.created_at
                                        ? new Date(
                                            reply.created_at,
                                          ).toLocaleString()
                                        : ""}
                                    </div>
                                  </div>
                                </div>

                                {reply.user_id === userId && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => {
                                        setEditingComment(reply.id);
                                        setEditContent(reply.content);
                                        setEditingAudioComment(
                                          reply.has_audio ? reply.id : null,
                                        );
                                      }}
                                    >
                                      <Edit size={12} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "Are you sure you want to delete this reply?",
                                          )
                                        ) {
                                          const formData = new FormData();
                                          formData.append(
                                            "comment_id",
                                            reply.id,
                                          );
                                          formData.append(
                                            "session_id",
                                            sessionId,
                                          );
                                          deleteCommentAction(formData).then(
                                            (result) => {
                                              if (result?.redirectUrl) {
                                                window.location.href =
                                                  result.redirectUrl;
                                              }
                                            },
                                          );
                                        }
                                      }}
                                    >
                                      <Trash size={12} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="ml-8">
                                {editingComment === reply.id ? (
                                  <form
                                    action={async (formData) => {
                                      if (
                                        reply.has_audio &&
                                        audioFeedbackBlob
                                      ) {
                                        formData.append(
                                          "audio_feedback",
                                          audioFeedbackBlob,
                                        );
                                        formData.append(
                                          "has_audio_feedback",
                                          "true",
                                        );
                                      }
                                      const result =
                                        await editCommentAction(formData);
                                      if (result?.redirectUrl) {
                                        window.location.href =
                                          result.redirectUrl;
                                      }
                                    }}
                                    className="space-y-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="comment_id"
                                      value={reply.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="session_id"
                                      value={sessionId}
                                    />

                                    {reply.has_audio ? (
                                      <div className="space-y-3">
                                        <div className="text-sm text-gray-600">
                                          Re-record your audio feedback:
                                        </div>
                                        <AudioRecorder
                                          onRecordingComplete={(blob) =>
                                            setAudioFeedbackBlob(blob)
                                          }
                                          initialAudioUrl={
                                            reply.audio_url || undefined
                                          }
                                        />
                                        <input
                                          type="hidden"
                                          name="content"
                                          value="[Audio Reply]"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            size="sm"
                                            disabled={!audioFeedbackBlob}
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <textarea
                                          name="content"
                                          value={editContent}
                                          onChange={(e) =>
                                            setEditContent(e.target.value)
                                          }
                                          className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          required
                                        ></textarea>
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                          >
                                            Cancel
                                          </Button>
                                          <Button type="submit" size="sm">
                                            Save
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </form>
                                ) : (
                                  <>
                                    {reply.has_audio ? (
                                      <div className="space-y-2">
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                          <Volume2 size={12} />
                                          <span>Audio Reply</span>
                                        </div>
                                        <AudioFeedbackPlayer
                                          audioUrl={reply.audio_url || ""}
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-800">
                                        {reply.content}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!editingComment && (
                        <div className="ml-11 mt-3">
                          <Tabs defaultValue="text" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger
                                value="text"
                                className="flex items-center gap-1 text-xs"
                              >
                                <MessageSquare size={12} />
                                Text
                              </TabsTrigger>
                              <TabsTrigger
                                value="audio"
                                className="flex items-center gap-1 text-xs"
                              >
                                <Mic size={12} />
                                Audio
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="text" className="mt-2">
                              <form
                                action={async (formData) => {
                                  const result =
                                    await addCommentAction(formData);
                                  if (result?.redirectUrl) {
                                    window.location.href = result.redirectUrl;
                                  }
                                }}
                                className="flex gap-2"
                              >
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
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                >
                                  Reply
                                </Button>
                              </form>
                            </TabsContent>
                            <TabsContent value="audio" className="mt-2">
                              <form
                                action={async (formData) => {
                                  formData.append("has_audio_feedback", "true");
                                  formData.append("content", "[Audio Reply]");
                                  const result =
                                    await addCommentAction(formData);
                                  if (result?.redirectUrl) {
                                    window.location.href = result.redirectUrl;
                                  }
                                }}
                                className="space-y-2"
                              >
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
                                <AudioRecorder
                                  onRecordingComplete={(blob) => {
                                    const formData = new FormData();
                                    formData.append("session_id", sessionId);
                                    formData.append("parent_id", comment.id);
                                    formData.append(
                                      "has_audio_feedback",
                                      "true",
                                    );
                                    formData.append("content", "[Audio Reply]");
                                    formData.append("audio_feedback", blob);

                                    addCommentAction(formData).then(
                                      (result) => {
                                        if (result?.redirectUrl) {
                                          window.location.href =
                                            result.redirectUrl;
                                        }
                                      },
                                    );
                                  }}
                                />
                              </form>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
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

            <div className="mt-6 pt-6 border-t">
              <form
                action={async (formData) => {
                  if (audioFeedbackBlob) {
                    formData.append("audio_feedback", audioFeedbackBlob);
                  }
                  const result = await addCommentAction(formData);
                  if (result?.redirectUrl) {
                    setAudioFeedbackBlob(null);
                    setCommentType("text");
                    window.location.href = result.redirectUrl;
                  }
                }}
                className="space-y-4"
              >
                <input type="hidden" name="session_id" value={sessionId} />
                {audioFeedbackBlob && (
                  <input type="hidden" name="has_audio_feedback" value="true" />
                )}

                <Tabs
                  defaultValue="text"
                  className="w-full"
                  onValueChange={(value) =>
                    setCommentType(value as "text" | "audio")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="text"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Text Feedback
                    </TabsTrigger>
                    <TabsTrigger
                      value="audio"
                      className="flex items-center gap-2"
                    >
                      <Mic size={16} />
                      Audio Feedback
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="mt-4">
                    <textarea
                      name="content"
                      placeholder="Add your general feedback here..."
                      className="w-full p-3 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={commentType === "text"}
                    ></textarea>
                  </TabsContent>
                  <TabsContent value="audio" className="mt-4">
                    <AudioRecorder
                      onRecordingComplete={(blob) => setAudioFeedbackBlob(blob)}
                    />
                    <input
                      type="hidden"
                      name="content"
                      value={commentType === "audio" ? "[Audio Feedback]" : ""}
                    />
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={commentType === "audio" && !audioFeedbackBlob}
                >
                  Add General Comment
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Fixed Audio Player at bottom of viewport - always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 shadow-lg bg-white border-t border-gray-200">
        <AudioPlayerControls
          duration={session.duration || 3600}
          onSeek={handleSeek}
          isFixed={true}
          currentTime={currentTime}
        />
      </div>
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
  if (!seconds && seconds !== 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
