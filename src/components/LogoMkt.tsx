'use client';

type Props = React.SVGProps<SVGSVGElement>;

/**
 * MeetingPost AI — Clean Wordmark
 * - Pure black/white SaaS branding
 * - No gradients, no luxury styling
 * - Subtle fade-in (accessible)
 * - Crisp geometric letterforms
 * - Built for professional UI headers
 */
export default function LogoMeetingPostWordmark(props: Props) {
  return (
    <svg
      viewBox="0 0 420 64"
      role="img"
      aria-label="MeetingPost AI Logo"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={`mp-fade ${props.className || ''}`}
    >
      {/* Text-only modern wordmark */}
      <text
        x="0"
        y="44"
        fill="var(--foreground)"
        fontFamily="'Montserrat', sans-serif"
        fontWeight="700"
        fontSize="34"
        letterSpacing="3"
      >
        MEETINGPOST AI
      </text>

      <style jsx>{`
        /* Subtle mount animation (no flashy motion) */
        @keyframes mpFadeIn {
          0% {
            opacity: 0;
            transform: translateY(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mp-fade {
          animation: mpFadeIn 0.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .mp-fade {
            animation: none;
          }
        }
      `}</style>
    </svg>
  );
}
