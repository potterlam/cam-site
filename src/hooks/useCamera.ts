"use client";

import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        setLocalStream(s);
      })
      .catch((err) => {
        setError(err.message || "Could not access camera/microphone");
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((v) => !v);
  };

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((v) => !v);
  };

  return { localStream, isMuted, isCamOff, toggleMute, toggleCam, error };
}
