"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { createClient } from "../../supabase/client";

interface AudioFeedbackPlayerProps {
  audioUrl: string;
}

export default function AudioFeedbackPlayer({
  audioUrl,
}: AudioFeedbackPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const supabase = createClient();
        const { data } = supabase.storage
          .from("feedback-recordings")
          .getPublicUrl(audioUrl);

        setPublicUrl(data.publicUrl);
      } catch (error) {
        console.error("Error fetching audio URL:", error);
      }
    };

    if (audioUrl) {
      fetchAudioUrl();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (publicUrl) {
      const audio = new Audio(publicUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      });

      audio.volume = isMuted ? 0 : volume;

      return () => {
        audio.pause();
        audio.removeEventListener("loadedmetadata", () => {});
        audio.removeEventListener("ended", () => {});
      };
    }
  }, [publicUrl, volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }

    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (!audioRef.current) return;

    setCurrentTime(audioRef.current.currentTime);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
    setPreviousVolume(newVolume > 0 ? newVolume : previousVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume;
      }
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      setIsMuted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!publicUrl) {
    return <div className="text-sm text-gray-500">Loading audio...</div>;
  }

  return (
    <div className="bg-gray-100 rounded-lg p-3 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <Button
          onClick={togglePlayPause}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6b7280 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%)`,
            }}
          />
        </div>
      </div>

      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.01"
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)`,
        }}
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
