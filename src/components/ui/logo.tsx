import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  showWordmark = true,
  showTagline = true,
  className,
}: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const taglineSizes = {
    sm: "text-[9px] tracking-widest",
    md: "text-[11px] tracking-widest",
    lg: "text-xs tracking-[0.2em]",
    xl: "text-sm tracking-[0.25em]",
  };

  return (
    <div className={cn("inline-flex flex-col items-center justify-center select-none", className)}>
      <div className="flex items-center gap-3">
        {/* Shield + Padlock + Fish-hook SVG Mark */}
        <div className={cn("relative shrink-0 flex items-center justify-center", iconSizes[size])}>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm transition-transform duration-300"
          >
            {/* Outer Security Shield */}
            <path
              d="M50 8L18 22V48C18 70 32 88 50 94C68 88 82 70 82 48V22L50 8Z"
              fill="url(#shield-grad)"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-[#0B5FFF]"
            />
            {/* Inner Shield Subtle Bevel */}
            <path
              d="M50 14L24 25V48C24 66 36 82 50 87C64 82 76 66 76 48V25L50 14Z"
              fill="#0E1E38"
              opacity="0.92"
            />
            {/* Fish-hook that loops into Padlock Shackle */}
            <path
              d="M42 36C42 30 46 25 52 25C58 25 62 29 62 35V45"
              stroke="#0B5FFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Padlock Body / Shield Core */}
            <rect
              x="36"
              y="44"
              width="28"
              height="24"
              rx="6"
              fill="#FFFFFF"
              className="dark:fill-[#F1F5F9]"
            />
            {/* Keyhole inside Padlock Body */}
            <circle cx="50" cy="53" r="3" fill="#1F2F3D" />
            <path d="M48.5 53H51.5L52.5 61H47.5L48.5 53Z" fill="#1F2F3D" />
            {/* Fish-hook barb accentuating the security defense */}
            <path
              d="M62 43L67 39"
              stroke="#0B5FFF"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="shield-grad" x1="50" y1="8" x2="50" y2="94" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0B5FFF" />
                <stop offset="1" stopColor="#083E9E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wordmark */}
        {showWordmark && (
          <div className="flex flex-col text-left">
            <div className={cn("font-extrabold tracking-tight leading-none", textSizes[size])}>
              <span className="text-[#1F2F3D] dark:text-[#F1F5F9]">Phish</span>
              <span className="text-[#0B5FFF]">Guard</span>
            </div>
            {showTagline && (
              <span
                className={cn(
                  "font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mt-1.5",
                  taglineSizes[size]
                )}
              >
                STAY ALERT. STAY SECURE.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
