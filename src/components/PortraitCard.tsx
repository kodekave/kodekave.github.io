import Plate from "./Plate";
import { profile } from "@/lib/content";

/**
 * The portrait as a black sketch drawn straight onto the page: no card, no
 * frame. It is a transparent layer of ruling (see Plate and scripts/engrave.py)
 * over a soft halo of paper, and it fades out on its own. The whole picture is
 * shown, so the equation on the hoodie stays in frame.
 *
 * `badge` adds the round sticker over the card's lower-left corner.
 */
export default function PortraitCard({
  alt,
  badge = false,
  priority = false,
  sizes = "(max-width: 640px) 80vw, 30vw",
  className = "",
}: {
  alt: string;
  badge?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="portrait">
        <span aria-hidden="true" className="portrait-halo" />
        <Plate alt={alt} priority={priority} sizes={sizes} />
      </div>
      {badge && <Badge />}
    </div>
  );
}

/**
 * The sticker: a yellow disc with a stitched edge, the word LinkedIn set across
 * it on a tilt with the "in" in an ink tile, as in the LinkedIn mark itself. It
 * is a link to the profile, and tips upright when you point at it.
 */
function Badge() {
  return (
    <a
      href={profile.linkedin}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label="Komal Kedarnath on LinkedIn (opens in a new tab)"
      className="badge absolute -bottom-5 -left-3 block h-[4.9rem] w-[4.9rem] sm:-bottom-6 sm:-left-7 sm:h-[5.6rem] sm:w-[5.6rem]"
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className="h-full w-full">
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="var(--color-brass)"
          stroke="var(--color-on-brass)"
          strokeWidth="1"
        />
        <circle
          cx="60"
          cy="60"
          r="51.5"
          fill="none"
          stroke="var(--color-on-brass)"
          strokeWidth="0.7"
          strokeDasharray="1.6 3.2"
          strokeLinecap="round"
        />
        <g transform="rotate(-11 60 60)">
          <text x="15" y="67" fontSize="21" textLength="58" lengthAdjust="spacingAndGlyphs">
            Linked
          </text>
          <rect x="77" y="46" width="27" height="27" rx="4.5" fill="var(--color-on-brass)" />
          <text className="badge-in" x="82" y="67" fontSize="21" textLength="17" lengthAdjust="spacingAndGlyphs">
            in
          </text>
        </g>
        <path
          d="M82 22 l8 -8 m-6 0 h6 v6"
          fill="none"
          stroke="var(--color-on-brass)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(-4 4)"
        />
      </svg>
    </a>
  );
}
