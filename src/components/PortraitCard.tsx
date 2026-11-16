import Plate from "./Plate";

/** Her own words for the sticker. */
export const BADGE_TEXT = "Bridging founders and operations";

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
 * The sticker: yellow disc, the words once around the ring, a small mark at
 * the centre. Still, so there is nothing to switch off under reduced motion.
 */
function Badge() {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={BADGE_TEXT}
      className="badge absolute -bottom-7 -left-5 h-[6.5rem] w-[6.5rem] sm:-bottom-9 sm:-left-9 sm:h-[7.5rem] sm:w-[7.5rem]"
    >
      <circle
        cx="60"
        cy="60"
        r="58"
        fill="var(--color-brass)"
        stroke="var(--color-ink)"
        strokeWidth="1"
      />
      <path
        id="badge-ring"
        d="M60 60 m-43 0 a43 43 0 1 1 86 0 a43 43 0 1 1 -86 0"
        fill="none"
      />
      <text aria-hidden="true">
        <textPath href="#badge-ring" textLength="268" lengthAdjust="spacing">
          {BADGE_TEXT} •
        </textPath>
      </text>
      <circle
        cx="60"
        cy="60"
        r="7"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1"
      />
      <circle cx="60" cy="60" r="2.2" fill="var(--color-ink)" />
    </svg>
  );
}
