import Link from "next/link";
import Arrow from "@/components/Arrow";
import JourneyMap from "@/components/JourneyMap";
import JourneyScene, { type SceneStep } from "@/components/JourneyScene";
import LocalTime from "@/components/LocalTime";
import Pattern from "@/components/Pattern";
import PortraitCard from "@/components/PortraitCard";
import { engagements, profile } from "@/lib/content";
import { EQUATION } from "@/lib/equation-points";
import { buildPlaces } from "@/lib/journey-places";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/",
  title: `${profile.tagline.replace(/\.$/, "")} — ${profile.name}`,
  description:
    "Komal Kedarnath helps founders build from idea to execution: four ventures across India, the Maldives, the US and the UK in more than six years.",
});

/**
 * The homepage: the opening (the portrait zooms into the equation on the hoodie
 * and fades, see JourneyScene), then a plain page that scrolls over the grid. The
 * journey is a map the point cloud forms, then what I bring, and the way to reach me, where the points condense into the equation.
 * Anything longer than a line lives on its own page, and the figures live on the
 * Ventures page (/work).
 *
 * Every word on it is already somewhere on the site; nothing here is new copy.
 */

const profiles = [
  { href: profile.linkedin, label: "LinkedIn", me: true },
  { href: "https://github.com/kodekave", label: "GitHub", me: true },
  { href: "https://orcid.org/0000-0003-4980-5945", label: "ORCID", me: true },
  { href: "https://zenodo.org/records/24120078", label: "Zenodo", me: false },
];

/** The first sentence of a longer line: enough to say what each thing is. */
const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

/** One section's frame: the page's width, with room above and below. */
function Frame({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className}`}>{children}</div>
  );
}

export default function HomePage() {
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

  // ---------------------------------------------------------- the page
  const steps: SceneStep[] = [
    {
      // The journey, as one card: a world map of dots with the places worked,
      // a list beside it and the details along the foot. On a wide screen the
      // point cloud flies in to form the map as the card arrives, and breaks up
      // again as it leaves. The same card is the /journey page.
      id: "journey",
      node: (
        <Frame className="py-16 md:py-24">
          <h2 className="sr-only">The journey</h2>
          <JourneyMap places={buildPlaces()} />
        </Frame>
      ),
    },
    {
      id: "work-with-me",
      node: (
        <Frame className="py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="label label-dot text-ink-faint">What I bring</p>
              <h2 className="font-display mt-6 text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.08]">
                A founder&rsquo;s office, without hiring one.
              </h2>
              <Link
                href="/services"
                className="label link-rule hit mt-6 inline-block text-ink-soft hover:text-ink"
              >
                How it works
              </Link>
            </div>
            <ul className="reg-list">
              {engagements.map((e) => (
                <li key={e.name} className="border-t border-hair py-6">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="font-display-text text-[1.35rem] leading-snug">
                      {e.name}
                    </span>
                    <span className="label shrink-0 text-ink-faint">{e.stamp}</span>
                  </div>
                  <p className="mt-2 max-w-[34em] leading-relaxed text-ink-soft">
                    {firstSentence(e.summary)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Frame>
      ),
    },
    {
      // The close. Where the equation slot is, the point cloud condenses into
      // the equation on the hoodie, which closes the loop with the opening.
      id: "contact",
      node: (
        <Frame className="pb-24 pt-10 md:pb-28 md:pt-16">
          <div className="contact-grid">
            <div>
              <div className="callout px-6 py-14 text-center md:py-20">
                <p className="label label-dot justify-center text-ink-faint">
                  <span>Contact</span>
                </p>
                <h2 className="font-display mx-auto mt-7 max-w-2xl text-[clamp(2.2rem,5.6vw,4.4rem)] leading-[1.02] lg:text-[clamp(2rem,3.4vw,3.1rem)]">
                  Building something? Let&rsquo;s talk.
                </h2>
                <div className="mt-10">
                  <a href={`mailto:${profile.email}`} className="btn btn-solid-paper">
                    Start a conversation
                    <Arrow className="btn-arrow" />
                  </a>
                </div>
              </div>

              <ul className="label mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ink-faint">
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
            </div>

            {/* Empty on purpose: the point cloud forms the equation here. */}
            <div
              data-eq-slot
              aria-hidden="true"
              className="eq-slot"
              style={{ aspectRatio: EQUATION.aspect }}
            />
          </div>
        </Frame>
      ),
    },
  ];

  return <JourneyScene intro={intro} steps={steps} />;
}
