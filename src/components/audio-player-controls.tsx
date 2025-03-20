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
  currentTime?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function AudioPlayerControls({
  duration = 3600, // Default to 1 hour
  onSeek,
  isFixed = false,
  currentTime: externalCurrentTime,
  isPlaying = false,
  onPlayPause = () => {},
}: AudioPlayerControlsProps) {
  const [isPlayingState, setIsPlayingState] = useState(isPlaying);
  const [currentTime, setCurrentTime] = useState(externalCurrentTime || 0);
  const [volume, setVolume] = useState(0.7);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Sync with external current time if provided
  useEffect(() => {
    if (externalCurrentTime !== undefined) {
      setCurrentTime(externalCurrentTime);
    }
  }, [externalCurrentTime]);

  // Sync with external isPlaying if provided
  useEffect(() => {
    setIsPlayingState(isPlaying);
  }, [isPlaying]);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingState) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1 * playbackSpeed;
          return newTime >= duration ? 0 : newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingState, duration, playbackSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if the player is in view
      if (!playerRef.current) return;

      // Check if user is typing in an input field, textarea, or contentEditable element
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true" ||
        activeElement?.tagName === "FORM";

      // Skip keyboard shortcuts if user is typing
      if (isTyping) return;

      // Prevent default space behavior (scrolling)
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
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
    setIsPlayingState(!isPlayingState);
    if (onPlayPause) onPlayPause();
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
      <div className="h-full flex items-center px-4">
        {/* Play controls on the left */}
        <div className="flex items-center gap-2 mr-4">
          <button
            className="text-gray-600 hover:text-blue-600"
            onClick={handleSkipBack}
            aria-label="Skip back 10 seconds"
          >
            <SkipBack size={20} />
          </button>
          <button
            className={`${isPlayingState ? "bg-blue-700" : "bg-blue-600"} text-white rounded-full p-2 hover:bg-blue-700`}
            onClick={handlePlayPause}
            aria-label={isPlayingState ? "Pause" : "Play"}
          >
            {isPlayingState ? (
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

        {/* Timeline slider takes most of the space */}
        <div className="flex-grow mx-2">
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

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Combined timestamp display */}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Volume control */}
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

          {/* Playback speed */}
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
    </div>
  );
}
