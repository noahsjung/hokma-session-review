"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Edit, Trash, X, Mic, Volume2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioRecorder from "@/components/audio-recorder";
import AudioFeedbackPlayer from "@/components/audio-feedback-player";
import {
  addCommentAction,
  editCommentAction,
  deleteCommentAction,
} from "@/app/actions";

// Adapting for Fireflies.ai API format
interface TranscriptSegment {
  id: string;
  segment_index: number;
  start_time: number;
  end_time: number;
  text: string;
  speaker?: string; // Made optional to handle transcripts without speaker identification
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  start_time?: number;
  end_time?: number;
  segment_id?: string;
  has_audio?: boolean;
  audio_url?: string;
  user?: {
    id: string;
    full_name: string;
  };
}

interface SelectableTranscriptProps {
  segments: TranscriptSegment[];
  sessionId: string;
  userRole: string;
  comments: Comment[];
  userId?: string;
}

export default function SelectableTranscript({
  segments,
  sessionId,
  userRole,
  comments,
  userId,
}: SelectableTranscriptProps) {
  const [selectedSegment, setSelectedSegment] =
    useState<TranscriptSegment | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ top: 0 });
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [commentType, setCommentType] = useState<"text" | "audio">("text");
  const [audioFeedbackBlob, setAudioFeedbackBlob] = useState<Blob | null>(null);
  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textRefs = useRef<{ [key: string]: HTMLParagraphElement | null }>({});

  // Group comments by segment ID for easier access
  const commentsBySegment = comments.reduce(
    (acc: Record<string, Comment[]>, comment) => {
      if (comment.segment_id) {
        if (!acc[comment.segment_id]) {
          acc[comment.segment_id] = [];
        }
        acc[comment.segment_id].push(comment);
      }
      return acc;
    },
    {},
  );

  // Reset comment form when comments change (new comment added)
  useEffect(() => {
    setShowCommentForm(false);
  }, [comments.length]);

  // Add comment icons to text on hover
  useEffect(() => {
    if (!hoveredSegment) return;

    const textElement = textRefs.current[hoveredSegment];
    if (!textElement) return;

    // Add comment icons to sentences
    const text = textElement.textContent || "";
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    if (sentences.length <= 1) return; // If there's only one sentence, don't add icons

    let html = "";
    let currentPos = 0;

    sentences.forEach((sentence) => {
      const sentenceStart = text.indexOf(sentence, currentPos);
      if (sentenceStart === -1) return;

      const sentenceEnd = sentenceStart + sentence.length;
      currentPos = sentenceEnd;

      html += `<span class="sentence-wrapper relative">
        ${sentence}
        <button class="comment-icon absolute opacity-0 hover:opacity-100 ml-1" data-start="${sentenceStart}" data-end="${sentenceEnd}">
          <MessageSquare size="14" class="text-blue-500" />
        </button>
      </span>`;
    });

    textElement.innerHTML = html;

    // Add event listeners to comment icons
    const commentIcons = textElement.querySelectorAll(".comment-icon");
    commentIcons.forEach((icon) => {
      icon.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const start = parseInt((icon as HTMLElement).dataset.start || "0");
        const end = parseInt((icon as HTMLElement).dataset.end || "0");
        const segment = segments.find((s) => s.id === hoveredSegment);
        if (!segment) return;

        const selectedSentence = text.substring(start, end);
        handleSentenceComment(segment, selectedSentence, start, end);
      });
    });

    return () => {
      // Clean up by restoring original text
      if (textElement) {
        textElement.innerHTML = text;
      }
    };
  }, [hoveredSegment, segments]);

  const handleSentenceComment = (
    segment: TranscriptSegment,
    text: string,
    textStart: number,
    textEnd: number,
  ) => {
    setSelectedSegment(segment);
    setSelectedText(text);

    // Calculate time range
    const segmentText = segment.text;
    const timePerChar =
      (segment.end_time - segment.start_time) / segmentText.length;
    const startTime = segment.start_time + textStart * timePerChar;
    const endTime = segment.start_time + textEnd * timePerChar;

    setSelectionRange({ start: startTime, end: endTime });
    setCommentPosition({ top: 0 });
    setShowCommentForm(true);
  };

  const handleTextSelection = (segment: TranscriptSegment) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();

    if (text && segment) {
      setSelectedSegment(segment);
      setSelectedText(text);

      // Calculate relative position within the segment text
      const segmentText = segment.text;
      const selectionStart = segmentText.indexOf(text);
      if (selectionStart >= 0) {
        const selectionEnd = selectionStart + text.length;
        const timePerChar =
          (segment.end_time - segment.start_time) / segmentText.length;
        const startTime = segment.start_time + selectionStart * timePerChar;
        const endTime = segment.start_time + selectionEnd * timePerChar;

        setSelectionRange({ start: startTime, end: endTime });
      }

      // Position the comment form next to the selection
      const segmentElement = segmentRefs.current[segment.id];
      if (segmentElement) {
        const rect = range.getBoundingClientRect();
        const segmentRect = segmentElement.getBoundingClientRect();
        setCommentPosition({ top: rect.top - segmentRect.top });
        setShowCommentForm(true);
      }
    }
  };

  const handleAddComment = (segment: TranscriptSegment) => {
    setSelectedSegment(segment);
    setSelectedText("");
    setSelectionRange(null);
    setCommentPosition({ top: 0 });
    setShowCommentForm(true);
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setSelectedSegment(null);
    setSelectedText("");
    setSelectionRange(null);
    setAudioFeedbackBlob(null);
    setCommentType("text");
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
    setAudioFeedbackBlob(null);
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle continuous transcript without speaker identification
  const renderTranscript = () => {
    // If there's only one segment or no speaker info, render as continuous text
    if (segments.length === 1 || !segments.some((s) => s.speaker)) {
      return (
        <div className="relative p-4 bg-white rounded-lg border border-gray-200">
          <p
            className="text-gray-800 cursor-text whitespace-pre-wrap"
            onMouseUp={() => handleTextSelection(segments[0])}
          >
            {segments.map((s) => s.text).join(" ")}
          </p>

          {!showCommentForm && (
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600"
                onClick={() => handleAddComment(segments[0])}
              >
                <MessageSquare size={16} className="mr-1" />
                Add Comment
              </Button>
            </div>
          )}

          {/* Comment form for continuous transcript */}
          {showCommentForm && selectedSegment && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <form
                action={async (formData) => {
                  if (audioFeedbackBlob) {
                    formData.append("audio_feedback", audioFeedbackBlob);
                    formData.append("has_audio_feedback", "true");
                  }
                  const result = await addCommentAction(formData);
                  if (result?.redirectUrl) {
                    setShowCommentForm(false);
                    setAudioFeedbackBlob(null);
                    setCommentType("text");
                    window.location.href = result.redirectUrl;
                  }
                }}
                className="space-y-3"
              >
                <input type="hidden" name="session_id" value={sessionId} />
                <input
                  type="hidden"
                  name="segment_id"
                  value={selectedSegment.id}
                />
                {selectionRange && (
                  <>
                    <input
                      type="hidden"
                      name="start_time"
                      value={selectionRange.start}
                    />
                    <input
                      type="hidden"
                      name="end_time"
                      value={selectionRange.end}
                    />
                  </>
                )}
                <div className="text-xs text-gray-500">
                  {selectedText ? (
                    <>
                      <span className="font-medium">Selected text:</span> "
                      {selectedText}"
                    </>
                  ) : (
                    "Add comment to transcript"
                  )}
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
                      placeholder="Add your feedback here..."
                      className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={commentType === "text"}
                      autoFocus
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelComment}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={commentType === "audio" && !audioFeedbackBlob}
                  >
                    Add Comment
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Display comments for continuous transcript */}
          {Object.values(commentsBySegment)
            .flat()
            .map((comment: Comment) => (
              <div
                key={comment.id}
                className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center">
                      <MessageSquare size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {comment.user?.full_name || "Supervisor"}
                      </div>
                      {comment.start_time && comment.end_time && (
                        <div className="text-xs text-gray-500 mb-1">
                          {formatTimestamp(comment.start_time)} -{" "}
                          {formatTimestamp(comment.end_time)}
                        </div>
                      )}

                      {editingComment === comment.id ? (
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
                          className="mt-1"
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
                                initialAudioUrl={comment.audio_url || undefined}
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
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              ></textarea>
                              <div className="flex justify-end gap-2 mt-2">
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
                        <div className="ml-0">
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
                            <div className="text-sm">{comment.content}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {userId === comment.user_id && !editingComment && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditComment(comment)}
                      >
                        <Edit size={14} />
                      </Button>
                      <form action={deleteCommentAction}>
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
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash size={14} />
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      );
    }

    // Otherwise, render with speaker identification
    return (
      <div className="space-y-6">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="group relative flex"
            ref={(el) => (segmentRefs.current[segment.id] = el)}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div className="flex-shrink-0 w-24 text-sm text-gray-500">
              {formatTimestamp(segment.start_time)}
            </div>
            <div className="flex-grow relative">
              {segment.speaker && (
                <div className="flex items-start gap-2 mb-1">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${segment.speaker === "Counselor" ? "bg-blue-500" : "bg-purple-500"}`}
                  >
                    {segment.speaker === "Counselor" ? "C" : "P"}
                  </div>
                  <div className="text-sm text-gray-600">{segment.speaker}</div>
                </div>
              )}
              <p
                ref={(el) => (textRefs.current[segment.id] = el)}
                className="text-gray-800 cursor-text"
                onMouseUp={() => handleTextSelection(segment)}
              >
                {segment.text}
              </p>

              {/* Inline comments for this segment */}
              {commentsBySegment[segment.id]?.map((comment: Comment) => (
                <div
                  key={comment.id}
                  className="mt-2 ml-8 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center">
                        <MessageSquare size={12} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {comment.user?.full_name || "Supervisor"}
                        </div>
                        {comment.start_time && comment.end_time && (
                          <div className="text-xs text-gray-500 mb-1">
                            {formatTimestamp(comment.start_time)} -{" "}
                            {formatTimestamp(comment.end_time)}
                          </div>
                        )}

                        {editingComment === comment.id ? (
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
                            className="mt-1"
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
                                <div className="flex justify-end gap-2 mt-2">
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
                          <div className="ml-0">
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
                              <div className="text-sm">{comment.content}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {userId === comment.user_id && !editingComment && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditComment(comment)}
                        >
                          <Edit size={14} />
                        </Button>
                        <form
                          action={async (formData) => {
                            const result = await deleteCommentAction(formData);
                            if (result?.redirectUrl) {
                              window.location.href = result.redirectUrl;
                            }
                          }}
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
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash size={14} />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Comment form that appears when text is selected */}
              {showCommentForm && selectedSegment?.id === segment.id && (
                <div
                  className="mt-2 ml-8 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  style={{ marginTop: `${commentPosition.top}px` }}
                >
                  <form
                    action={async (formData) => {
                      if (audioFeedbackBlob) {
                        formData.append("audio_feedback", audioFeedbackBlob);
                        formData.append("has_audio_feedback", "true");
                      }
                      const result = await addCommentAction(formData);
                      if (result?.redirectUrl) {
                        setShowCommentForm(false);
                        setAudioFeedbackBlob(null);
                        setCommentType("text");
                        window.location.href = result.redirectUrl;
                      }
                    }}
                    className="space-y-3"
                  >
                    <input type="hidden" name="session_id" value={sessionId} />
                    <input
                      type="hidden"
                      name="segment_id"
                      value={selectedSegment.id}
                    />
                    {selectionRange && (
                      <>
                        <input
                          type="hidden"
                          name="start_time"
                          value={selectionRange.start}
                        />
                        <input
                          type="hidden"
                          name="end_time"
                          value={selectionRange.end}
                        />
                      </>
                    )}
                    <div className="text-xs text-gray-500">
                      {selectedText ? (
                        <>
                          <span className="font-medium">Selected text:</span> "
                          {selectedText}"
                        </>
                      ) : (
                        "Add comment to this segment"
                      )}
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
                          placeholder="Add your feedback here..."
                          className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            commentType === "audio" ? "[Audio Feedback]" : ""
                          }
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelComment}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={commentType === "audio" && !audioFeedbackBlob}
                      >
                        Add Comment
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {!showCommentForm && hoveredSegment === segment.id && (
              <div className="absolute right-0 top-0 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600"
                  onClick={() => handleAddComment(segment)}
                >
                  <MessageSquare size={16} className="mr-1" />
                  Comment
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return renderTranscript();
}
