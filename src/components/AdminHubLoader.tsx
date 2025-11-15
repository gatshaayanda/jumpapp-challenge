"use client";

import { useEffect, useState } from "react";

export default function JumpappLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    const hideTimer = setTimeout(() => setVisible(false), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading Jumpapp"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-[900ms] ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "#ffffff",
        color: "#111",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* AI Pulse Icon */}
      <div className="relative h-24 w-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>

        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          className="text-blue-600 animate-ai"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 2c4 0 8 3 8 8s-4 8-8 8-8-3-8-8 4-8 8-8z" />
          <circle cx="12" cy="10" r="3" />
          <path d="M12 13v4" />
        </svg>
      </div>

      {/* App Name */}
      <div className="text-2xl font-semibold tracking-wide fade-in">
        JUMPAPP
      </div>

      {/* Tagline */}
      <div className="text-sm text-gray-600 mt-1 fade-in-delayed">
        Generating your meeting content…
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-8 overflow-hidden">
        <div className="h-full w-1/3 loader-bar"></div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes loaderBar {
          0% {
            transform: translateX(-150%);
          }
          50% {
            transform: translateX(20%);
          }
          100% {
            transform: translateX(150%);
          }
        }

        .loader-bar {
          background: linear-gradient(90deg, #2563eb, #60a5fa, #2563eb);
          animation: loaderBar 1.8s cubic-bezier(0.45, 0, 0.25, 1) infinite;
        }

        @keyframes aiPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-ai {
          animation: aiPulse 2.4s ease-in-out infinite;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 1s ease forwards;
        }

        .fade-in-delayed {
          opacity: 0;
          animation: fadeIn 1s ease 0.3s forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
