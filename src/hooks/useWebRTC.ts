"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  socket: Socket | null;
  localStream: MediaStream | null;
  mySocketId: string;
  members: Array<{ socketId: string; userId: string; userName: string }>;
}

export function useWebRTC({ socket, localStream, mySocketId, members }: UseWebRTCOptions) {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const createPeer = useCallback(
    (targetSocketId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(targetSocketId, pc);

      // Add local tracks
      localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // Handle remote tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => new Map(prev).set(targetSocketId, stream));
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("webrtc-ice-candidate", {
            to: targetSocketId,
            from: mySocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          peersRef.current.delete(targetSocketId);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(targetSocketId);
            return next;
          });
        }
      };

      return pc;
    },
    [socket, localStream, mySocketId]
  );

  // Initiate connections to existing members when we join
  useEffect(() => {
    if (!socket || !localStream) return;

    members
      .filter((m) => m.socketId !== mySocketId && !peersRef.current.has(m.socketId))
      .forEach(async (member) => {
        const pc = createPeer(member.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: member.socketId, from: mySocketId, offer });
      });
  }, [members, socket, localStream, mySocketId, createPeer]);

  // Socket signal handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc-offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = createPeer(from);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: from, from: mySocketId, answer });
    });

    socket.on("webrtc-answer", async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(answer);
    });

    socket.on("webrtc-ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.addIceCandidate(candidate);
    });

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [socket, mySocketId, createPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  return { remoteStreams };
}
