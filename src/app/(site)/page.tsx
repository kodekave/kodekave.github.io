import type { ReactNode } from "react";
import Link from "next/link";
import Arrow from "@/components/Arrow";
import JourneyMap from "@/components/JourneyMap";
import JourneyScene, { type SceneStep } from "@/components/JourneyScene";
import LocalTime from "@/components/LocalTime";
import Pattern from "@/components/Pattern";
import PortraitCard from "@/components/PortraitCard";
import { engagements, profile } from "@/lib/content";
import { buildPlaces } from "@/lib/journey-places";
import { getPublishedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/",
  title: `${profile.tagline.replace(/\.$/, "")} — ${profile.name}`,
  description:
    "Komal Kedarnath helps founders build from idea to execution: four ventures across India, the Maldives, the US and the UK in more than six years.",
});

/**
 * The homepage as a one-page journey (see JourneyScene): the opening, then the
 * journey as a map the cloud's points form (the same card is /journey), what I
 * bring, the writing and the way to reach me, one after another as you scroll.
 * Anything longer than a line lives on its own page, and the figures live on
 * the Ventures page (/work).
 *
 * Every word on it is already somewhere on the site; nothing here is new copy.
 */

const profiles = [
  { href: profile.linkedin, label: "LinkedIn", me: true },
  { href: "https://github.com/kodekave", label: "GitHub", me: true },
  { href: "https://orcid.org/0000-0003-4980-5945", label: "ORCID", me: true },
  { href: "https://zenodo.org/records/24120078", label: "Zenodo", me: false },
];

/**
 * The header of a card: its place in the run of cards ("02/04") and its name,
 * set the same way as the map card's own header. The names are the ones on the
 * dot rail (see the steps below).
 */
function CardLabel({
  n,
  className = "",
  children,
}: {
  n: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`label flex items-center gap-3 text-ink-faint ${className}`}>
      <span className="text-brass-deep tabular">{n}</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * One stop on the journey. Shown as an ordinary section when the page is not
 * pinned, and as a panel beside the cloud when it is (`.journey-panel`).
 */
function Step({
  label,
  bare = false,
  wide = false,
  children,
}: {
  label?: ReactNode;
  /** No panel of its own: the content is already a panel. */
  bare?: boolean;
  /** The full width of the page, for the map. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="step-wrap mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
      <div
        className={`step-body journey-panel${label ? " has-label" : ""}${
          bare ? " is-bare" : ""
        }${wide ? " is-wide" : ""}`}
      >
        {label}
        <div className="step-main">{children}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const posts = getPublishedPosts().slice(0, 4);
  // The cards are numbered as a run ("01/04"): the map, what I bring, the
  // writing (only when there are posts) and contact.
  const total = posts.length > 0 ? 4 : 3;
  const num = (i: number) => `${String(i).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
  // ------------------------------------------------------- the opening
  // `data-zoom` is the portrait: the scroll zooms into the equation on the
  // hoodie. `data-intro-fade` is whatever falls away first.
  const intro = (
    <section id="hero" data-intro className="journey-intro">
      <div data-intro-fade className="absolute inset-0">
        <Pattern kind="lorenz" flow />
      </div>

      <div className="intro-grid">
        <div data-intro-fade className="settle">
          <p className="label label-dot text-ink-faint">
            <span>
              Local time, <LocalTime />, {profile.location}
            </span>
          </p>

          {/* The statement leads. The name is the first thing a screen
              reader hears, and is set again, quietly, just below. */}
          <h1 className="font-display mt-6 max-w-[11.6em] text-[clamp(2.3rem,6.2vw,5.5rem)] leading-[1.03] md:mt-9">
            <span className="sr-only">{profile.name}: </span>
            {profile.tagline}
          </h1>

          <p className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-1 md:mt-11">
            <span className="font-display-text text-[1.25rem]">
              {profile.name}
            </span>
            <span className="font-display-text text-[1.25rem] text-brass-deep">
              Startups-Operator. Maker. Explorer.
            </span>
          </p>

          <div className="mt-6 md:mt-10">
            <a href={`mailto:${profile.email}`} className="btn btn-ink">
              Start a conversation
              <Arrow className="btn-arrow" />
            </a>
          </div>

          {/* The proof, in your own words from the Ventures page. */}
          <p className="label mt-5 text-ink-faint md:mt-6">
            4 ventures · 4 countries · 6+ years
          </p>
        </div>

        <div data-zoom className="intro-portrait settle-fade">
          <PortraitCard
            alt={`${profile.name}, black sketch portrait`}
            badge
            priority
            sizes="(max-width: 640px) 78vw, 432px"
            className="w-full"
          />
        </div>
      </div>

      <span aria-hidden="true" data-intro-fade className="journey-cue" />
    </section>
  );

  // ---------------------------------------------------------- the stops
  const steps: SceneStep[] = [
    {
      // The journey, as one card: a world map of dots with the places worked,
      // a list beside it and the details along the foot. In the scroll scene the
      // cloud's points fly in to form the map (`map`), and break up again when
      // you scroll on. The same card is the /journey page.
      id: "journey",
      label: "Journey",
      map: true,
      node: (
        <Step bare wide>
          <h2 className="sr-only">The journey</h2>
          <JourneyMap places={buildPlaces()} cardNumber={num(1)} />
        </Step>
      ),
    },
    {
      id: "work-with-me",
      label: "What I bring",
      node: (
        <Step
          label={
            <CardLabel n={num(2)} className="lg:pt-1">
              What I bring
            </CardLabel>
          }
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="step-title font-display text-3xl sm:text-4xl">What I bring</h2>
            <Link
              href="/services"
              className="label link-rule hit text-ink-soft hover:text-ink"
            >
              How it works
            </Link>
          </div>
          <ul className="reg-list mt-8">
            {engagements.map((e) => (
              <li
                key={e.name}
                className="flex items-baseline justify-between gap-6 border-t border-hair py-4"
              >
                <span className="reg-name font-display-text text-[1.25rem] leading-snug">
                  {e.name}
                </span>
                <span className="label shrink-0 text-ink-faint">{e.stamp}</span>
              </li>
            ))}
          </ul>
        </Step>
      ),
    },
    ...(posts.length > 0
      ? [
          {
            id: "writing",
            label: "Latest writing",
            node: (
              <Step
                label={
                  <CardLabel n={num(3)} className="lg:pt-1">
                    Latest writing
                  </CardLabel>
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="step-title font-display text-3xl sm:text-4xl">
                    Latest writing
                  </h2>
                  <Link
                    href="/blog"
                    className="label link-rule hit text-ink-soft hover:text-ink"
                  >
                    All posts
                  </Link>
                </div>
                <ul className="reg-list mt-8">
                  {posts.map((post) => (
                    <li key={post.slug} className="border-t border-hair">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4 sm:flex-nowrap"
                      >
                        <time
                          dateTime={post.published_at}
                          className="label tabular w-full flex-none text-ink-faint sm:w-[6.4rem]"
                        >
                          {post.published_at.slice(0, 10)}
                        </time>
                        <span className="post-title font-display-text text-[1.0625rem] leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Step>
            ),
          },
        ]
      : []),
    {
      id: "contact",
      label: "Contact",
      node: (
        <Step bare>
          <div className="callout px-6 py-16 text-center md:py-24">
            <p className="label label-dot justify-center text-ink-faint">
              <span className="text-brass-deep tabular">{num(total)}</span>
              <span>Contact</span>
            </p>
            <h2 className="font-display mx-auto mt-7 max-w-2xl text-[clamp(2.4rem,5.6vw,4.4rem)] leading-[1.02]">
              Building something? Let&rsquo;s talk.
            </h2>
            <div className="mt-10">
              <a
                href={`mailto:${profile.email}`}
                className="btn btn-solid-paper"
              >
                Start a conversation
                <Arrow className="btn-arrow" />
              </a>
            </div>
          </div>

          <ul className="profile-links label mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ink-faint">
            {profiles.map((p) => (
              <li key={p.label}>
                <a
                  href={p.href}
                  target="_blank"
                  rel={p.me ? "me noopener noreferrer" : "noopener noreferrer"}
                  className="link-rule hit hit-sm hover:text-ink"
                >
                  {p.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Step>
      ),
    },
  ];

  return <JourneyScene intro={intro} steps={steps} />;
}
