'use client';

type Props = React.SVGProps<SVGSVGElement>;

/**
 * MeetingPost AI Logo
 * - Clean "MP" monogram
 * - Burgundy badge using your global theme variables
 * - Subtle breathing/pulse for a modern AI feel
 * - Lightweight: no filters, no complex gradients
 */
export default function LogoMeetingPost(props: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="MeetingPost AI Logo"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={`mp-pulse ${props.className || ''}`}
    >
      {/* Outer Circle / Badge */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="var(--brand-primary)"
        stroke="var(--brand-secondary)"
        strokeWidth="2"
      />

      {/* "M" */}
      <path
        d="M18 42V22l7 10 7-10v20"
        stroke="var(--brand-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "P" */}
      <path
        d="M36 22h6a6 6 0 0 1 0 12h-6v8"
        stroke="var(--brand-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <style jsx>{`
        @keyframes mpPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 4px rgba(184,155,89,0.25));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 10px rgba(214,182,120,0.4));
          }
        }

        .mp-pulse {
          animation: mpPulse 4.5s cubic-bezier(0.45, 0, 0.25, 1) infinite;
          transform-origin: center;
        }
      `}</style>
    </svg>
  );
}
