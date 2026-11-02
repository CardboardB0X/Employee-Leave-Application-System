"use client";

import React from "react";

interface CircularProgressMeterProps {
  value: number; // Current value (e.g. 12)
  max: number; // Max total (e.g. 15)
  size?: number; // Outer diameter in pixels
  strokeWidth?: number; // Border thickness
  colorClass?: string; // Tailwind stroke color class
  trackColorClass?: string; // Background stroke
  symbol?: string; // Optional indicator
}

export default function CircularProgressMeter({
  value,
  max,
  size = 64,
  strokeWidth = 6,
  colorClass = "text-emerald-500",
  trackColorClass = "text-slate-100",
  symbol,
}: CircularProgressMeterProps) {
  const safeMax = max > 0 ? max : 1;
  const clampedValue = Math.max(0, Math.min(value, safeMax));
  const percentage = Math.round((clampedValue / safeMax) * 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={`${trackColorClass} transition-colors duration-200`}
          fill="transparent"
        />

        {/* Dynamic progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>

      {/* Center value overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black text-slate-800 tracking-tight font-mono tabular-nums leading-none">
          {Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)}
        </span>
        {symbol && (
          <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">
            {symbol}
          </span>
        )}
      </div>
    </div>
  );
}
