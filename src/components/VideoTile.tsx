"use client";

import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  userName: string;
  isMuted?: boolean;
  isCamOff?: boolean;
  isLocal?: boolean;
}

export default function VideoTile({ stream, userName, isMuted, isCamOff, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
      {isCamOff || !stream ? (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="text-4xl">📷</span>
          <span className="text-sm">{userName}</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className="w-full h-full object-cover"
        />
      )}
      {/* Name tag */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-sm font-medium flex items-center gap-1">
        {isLocal && <span className="text-violet-400">(You)</span>}
        <span className="truncate">{userName}</span>
        {isMuted && <span className="ml-auto text-red-400">🔇</span>}
      </div>
    </div>
  );
}
