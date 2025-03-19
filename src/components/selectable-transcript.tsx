"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { addCommentAction } from "@/app/actions";

interface TranscriptSegment {
  id: string;
  segment_index: number;
  start_time: number;
  end_time: number;
  text: string;
  speaker: string;
}

interface SelectableTranscriptProps {
  segments: TranscriptSegment[];
  sessionId: string;
  userRole: string;
  comments: any[];
}

export default function SelectableTranscript({
  segments,
  sessionId,
  userRole,
  comments,
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
  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Group comments by segment ID for easier access
  const commentsBySegment = comments.reduce((acc, comment) => {
    if (comment.segment_id) {
      if (!acc[comment.segment_id]) {
        acc[comment.segment_id] = [];
      }
      acc[comment.segment_id].push(comment);
    }
    return acc;
  }, {});

  // Debug output
  console.log("SelectableTranscript - Segments count:", segments.length);
  console.log("SelectableTranscript - Comments count:", comments.length);
  console.log(
    "SelectableTranscript - Comments by segment:",
    Object.keys(commentsBySegment).length,
  );

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

  const handleAddComment = () => {
    setShowCommentForm(true);
  };

  const handleCancelComment = () => {
    setShowCommentForm(false);
    setSelectedSegment(null);
    setSelectedText("");
    setSelectionRange(null);
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="group relative flex"
          ref={(el) => (segmentRefs.current[segment.id] = el)}
        >
          <div className="flex-shrink-0 w-24 text-sm text-gray-500">
            {formatTimestamp(segment.start_time)}
          </div>
          <div className="flex-grow relative">
            <div className="flex items-start gap-2 mb-1">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${segment.speaker === "Counselor" ? "bg-blue-500" : "bg-purple-500"}`}
              >
                {segment.speaker === "Counselor" ? "C" : "P"}
              </div>
              <div className="font-medium">{segment.speaker}</div>
            </div>
            <p
              className="text-gray-800 cursor-text"
              onMouseUp={() =>
                userRole === "supervisor" && handleTextSelection(segment)
              }
            >
              {segment.text}
            </p>

            {/* Inline comments for this segment */}
            {commentsBySegment[segment.id]?.map((comment: any) => (
              <div
                key={comment.id}
                className="mt-2 ml-8 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
              >
                <div className="flex items-start gap-2">
                  <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center">
                    <MessageSquare size={12} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {comment.user?.full_name || "Supervisor"}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {formatTimestamp(comment.start_time)} -{" "}
                      {formatTimestamp(comment.end_time)}
                    </div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Comment form that appears when text is selected */}
            {showCommentForm && selectedSegment?.id === segment.id && (
              <div
                className="mt-2 ml-8 p-3 bg-gray-50 rounded-lg border border-gray-200"
                style={{ marginTop: `${commentPosition.top}px` }}
              >
                <form action={addCommentAction} className="space-y-3">
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
                  <textarea
                    name="content"
                    placeholder="Add your feedback here..."
                    className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    autoFocus
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelComment}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Add Comment
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {userRole === "supervisor" && !showCommentForm && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600"
                onClick={() => {
                  setSelectedSegment(segment);
                  setShowCommentForm(true);
                  setCommentPosition({ top: 0 });
                }}
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
}
