"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  initialAudioUrl?: string;
}

export default function AudioRecorder({
  onRecordingComplete,
  initialAudioUrl,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    initialAudioUrl || null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(audioUrl || "");
      audioRef.current.onended = () => setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Reset state
      setAudioUrl(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Could not access microphone. Please check your browser permissions.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioUrl; // Ensure the latest URL is used
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center gap-3">
        {!isRecording && !audioUrl && (
          <Button
            onClick={startRecording}
            variant="outline"
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          >
            <Mic size={16} />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-red-600 font-medium">
                {formatTime(recordingTime)}
              </span>
            </div>
            <Button
              onClick={stopRecording}
              variant="outline"
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600"
            >
              <Square size={16} />
              Stop Recording
            </Button>
          </>
        )}

        {audioUrl && !isRecording && (
          <>
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? "Pause" : "Play"} Recording
            </Button>
            <Button
              onClick={startRecording}
              variant="outline"
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            >
              <Mic size={16} />
              Re-record
            </Button>
          </>
        )}
      </div>

      {audioUrl && (
        <div className="text-sm text-gray-500">
          Audio recording ready.{" "}
          {isPlaying ? "Playing..." : "Click play to listen."}
        </div>
      )}
    </div>
  );
}
