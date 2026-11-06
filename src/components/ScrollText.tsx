import { Fragment, type CSSProperties } from "react";

/**
 * A paragraph that is read into focus: each word starts dim and comes up to
 * full strength as the paragraph scrolls through the viewport, in order, so
 * the eye is led along the sentence at the speed of the scroll.
 *
 * The text stays one ordinary paragraph — the words are inline spans — so
 * screen readers and crawlers see it unchanged. The effect itself is a pure
 * CSS scroll-driven animation (see globals.css); where that is unsupported,
 * or motion is reduced, every word is simply at full strength.
 */
export default function ScrollText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  const last = words.length - 1;

  return (
    <p className={`scroll-text ${className}`}>
      {words.map((word, i) => {
        // Each word owns a short slice of the paragraph's scroll range;
        // the slices are staggered so they light in reading order.
        const start = 6 + (i / words.length) * 34;
        return (
          <Fragment key={i}>
            <span
              className="sw"
              style={
                {
                  "--a": `${start.toFixed(1)}%`,
                  "--b": `${(start + 9).toFixed(1)}%`,
                } as CSSProperties
              }
            >
              {word}
            </span>
            {i < last ? " " : null}
          </Fragment>
        );
      })}
    </p>
  );
}
