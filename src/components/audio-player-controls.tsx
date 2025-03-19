"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Minimize2,
  Maximize2,
} from "lucide-react";

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
  const [isMinimized, setIsMinimized] = useState(false);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1;
          return newTime >= duration ? 0 : newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div
      className={`bg-white border-t shadow-md transition-all ${isFixed ? "fixed bottom-0 left-0 right-0 z-50" : ""} ${isMinimized && isFixed ? "h-12" : ""}`}
    >
      {isMinimized && isFixed ? (
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-2">
            <button
              className={`${isPlaying ? "text-blue-600" : "text-gray-600"} hover:text-blue-700`}
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            className="text-gray-600 hover:text-blue-600"
            onClick={toggleMinimize}
            aria-label="Maximize player"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col items-center">
          {isFixed && (
            <div className="w-full flex justify-end mb-2">
              <button
                className="text-gray-600 hover:text-blue-600"
                onClick={toggleMinimize}
                aria-label="Minimize player"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          )}

          <div className="w-full flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-500 w-12">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-grow h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`,
              }}
            />
            <span className="text-sm text-gray-500 w-12">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6b7280 ${volume * 100}%, #e5e7eb ${volume * 100}%)`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
