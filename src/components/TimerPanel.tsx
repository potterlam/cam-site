"use client";

import { useEffect, useRef, useState } from "react";

export default function TimerPanel() {
  const [seconds, setSeconds] = useState(30);
  const [loops, setLoops] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loopsLeft, setLoopsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    if (seconds <= 0 || loops <= 0) return;
    setTimeLeft(seconds);
    setLoopsLeft(loops);
    setRunning(true);
  }

  function stop() {
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setRunning(false);
    setTimeLeft(null);
    setLoopsLeft(0);
  }

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // One loop done
          setLoopsLeft((lp) => {
            const next = lp - 1;
            if (next <= 0) {
              // All loops done
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              setRunning(false);
              setTimeLeft(0);
              return 0;
            }
            // Start next loop
            return next;
          });
          return seconds; // reset timer for next loop
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [running, seconds]);

  const pct = timeLeft !== null && seconds > 0 ? (timeLeft / seconds) * 100 : 0;
  const isDone = running === false && timeLeft === 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-3 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">⏱️ Timer</h3>

      {/* Settings — only when not running */}
      {!running && timeLeft !== 0 && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 mb-0.5 block">Seconds</label>
            <input
              type="number"
              min={1}
              max={3600}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 mb-0.5 block">Loops</label>
            <input
              type="number"
              min={1}
              max={99}
              value={loops}
              onChange={(e) => setLoops(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Countdown display */}
      {timeLeft !== null && (
        <div className="text-center space-y-1">
          {/* Progress ring / bar */}
          <div className="relative h-2 rounded-full bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isDone ? "bg-green-500" : pct > 30 ? "bg-violet-500" : pct > 10 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-3xl font-mono font-bold tabular-nums ${isDone ? "text-green-400" : "text-white"}`}>
            {isDone ? "✓ Done!" : `${timeLeft}s`}
          </p>
          {!isDone && loopsLeft > 1 && (
            <p className="text-xs text-gray-500">Loop {loops - loopsLeft + 1} / {loops}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={isDone ? stop : start}
            className="flex-1 rounded-xl bg-violet-700 hover:bg-violet-600 py-2 text-sm font-semibold transition-colors"
          >
            {isDone ? "↺ Reset" : "▶ Start"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 py-2 text-sm font-semibold transition-colors"
          >
            ■ Stop
          </button>
        )}
      </div>
    </div>
  );
}
