"use client";

import { Play, SkipBack, SkipForward, Volume2 } from "lucide-react";

export default function AudioPlayerControls() {
  const handleSkipBack = () => console.log("Skip back");
  const handlePlay = () => console.log("Play");
  const handleSkipForward = () => console.log("Skip forward");

  return (
    <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center">
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
        <div className="bg-blue-600 h-1.5 rounded-full w-1/3"></div>
      </div>
      <div className="flex items-center justify-between w-full px-4">
        <span className="text-sm text-gray-500">0:00</span>
        <div className="flex items-center gap-4">
          <button
            className="text-gray-600 hover:text-blue-600"
            onClick={handleSkipBack}
          >
            <SkipBack size={20} />
          </button>
          <button
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700"
            onClick={handlePlay}
          >
            <Play size={20} fill="currentColor" />
          </button>
          <button
            className="text-gray-600 hover:text-blue-600"
            onClick={handleSkipForward}
          >
            <SkipForward size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-gray-500" />
          <div className="w-20 bg-gray-200 rounded-full h-1.5">
            <div className="bg-gray-500 h-1.5 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
