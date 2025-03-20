"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioPlayerControlsProps {
  duration?: number;
  onSeek?: (time: number) => void;
  isFixed?: boolean;
}

export default function AudioPlayerControls({
  duration = 3600, // Default to 1 hour
  onSeek,
  isFixed = false,
}: AudioPlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1 * playbackSpeed;
          return newTime >= duration ? 0 : newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if the player is in view
      if (!playerRef.current) return;

      // Prevent default space behavior (scrolling)
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }

      // Arrow keys for seeking
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const newTime = Math.max(0, currentTime - 5);
        setCurrentTime(newTime);
        if (onSeek) onSeek(newTime);
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        const newTime = Math.min(duration, currentTime + 5);
        setCurrentTime(newTime);
        if (onSeek) onSeek(newTime);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, onSeek]);

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setCurrentTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={playerRef}
      className={`bg-white border-t shadow-md transition-all h-16 ${isFixed ? "fixed bottom-0 left-0 right-0 z-50" : ""}`}
    >
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-2 w-24">
          <span className="text-sm text-gray-500">
            {formatTime(currentTime)}
          </span>
        </div>

        <div className="flex-grow mx-4">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2563eb ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`,
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-24 justify-end">
          <span className="text-sm text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 flex items-center gap-4">
        <button
          className="text-gray-600 hover:text-blue-600"
          onClick={handleSkipBack}
          aria-label="Skip back 10 seconds"
        >
          <SkipBack size={20} />
        </button>
        <button
          className={`${isPlaying ? "bg-blue-700" : "bg-blue-600"} text-white rounded-full p-2 hover:bg-blue-700`}
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>
        <button
          className="text-gray-600 hover:text-blue-600"
          onClick={handleSkipForward}
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward size={20} />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6b7280 ${volume * 100}%, #e5e7eb ${volume * 100}%)`,
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings size={16} />
              <span className="sr-only">Playback speed</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleSpeedChange(0.5)}
              className={playbackSpeed === 0.5 ? "bg-gray-100" : ""}
            >
              0.5x
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSpeedChange(0.75)}
              className={playbackSpeed === 0.75 ? "bg-gray-100" : ""}
            >
              0.75x
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSpeedChange(1.0)}
              className={playbackSpeed === 1.0 ? "bg-gray-100" : ""}
            >
              1.0x
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSpeedChange(1.25)}
              className={playbackSpeed === 1.25 ? "bg-gray-100" : ""}
            >
              1.25x
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSpeedChange(1.5)}
              className={playbackSpeed === 1.5 ? "bg-gray-100" : ""}
            >
              1.5x
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSpeedChange(2.0)}
              className={playbackSpeed === 2.0 ? "bg-gray-100" : ""}
            >
              2.0x
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
