import Arrow from "@/components/Arrow";
import Masthead from "@/components/Masthead";
import ResearchPhone from "@/components/ResearchPhone";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import { publication, recognition, workbench } from "@/lib/content";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata = buildMetadata({
  path: "/research",
  title: "Research: OpenFOAM on Android, Open CapIQ Workbench",
  description:
    "Research and projects by Komal Kedarnath: OpenFOAM CFD on an Android phone (FOSSEE, IIT Bombay), and a browser workbench for open-source equity research and valuation.",
});

/**
 * Research and projects.
 *
 * This is the one place every project and piece of research is listed. The
 * published study leads, drawn as the object it is about; the workbench follows;
 * the research programmes they grew out of close the page. A new paper or
 * project is added as a further section here, numbered in order, so the
 * homepage stays short and links in.
 */
export default function ResearchPage() {
  // The paper's own figures, plus the one number that is Zenodo's.
  const facts = [
    { value: `${publication.facts.simulatedSeconds} s`, label: "Simulated on the phone" },
    { value: String(publication.facts.courantBelow), label: "Courant number, stayed below about" },
    { value: `${publication.facts.memoryGb} GB`, label: `Memory, ${publication.facts.device}` },
    { value: String(publication.zenodo.downloads), label: "Downloads on Zenodo" },
  ];
  const zenodoDate = new Date(publication.zenodo.asOf).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  // The FOSSEE case-study entry is this same paper, so it is not listed twice.
  const related = recognition.filter((r) => !r.title.startsWith("Running OpenFOAM"));
  // The workbench is its own repository, served from this domain, so these are
  // plain links rather than routes of this site.
  const workbenchUrl = absoluteUrl(workbench.path);
  const workbenchFacts = [
    { value: String(workbench.facts.tools), label: "Open data tools mapped" },
    { value: String(workbench.facts.methods), label: "Valuation methods, live" },
    { value: String(workbench.facts.dependencies), label: "Dependencies" },
    { value: String(workbench.facts.files), label: "HTML file, no build step" },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Research", path: "/research" },
            ])
          )
        )}
      />

      <Masthead
        pattern="contours"
        label="Research"
        title={<>Research and projects.</>}
        lead={
          <>
            One published study, a working tool, and the research programmes
            around them.
          </>
        }
      />

      {/* --------------------------------------------------- 01 · the paper */}
      <section
        id="openfoam-on-android"
        className="on-paper relative scroll-mt-16 overflow-hidden"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-x-20 gap-y-16 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <SectionLabel n="01" className="text-ink-faint">
              Published
            </SectionLabel>
            <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
              CFD on a phone.
            </h2>
            <p className="font-read mt-6 text-xl italic text-ink-soft">
              {publication.title}
            </p>
            <p className="label mt-3 text-ink-faint">
              {publication.type} · FOSSEE, IIT Bombay · {publication.version} · CC BY 4.0
            </p>
            <p className="mt-7 max-w-xl text-lg leading-[1.65] text-ink-soft">
              A step-by-step workflow for running OpenFOAM, a solver built for
              desktops and clusters, on an Android phone, taken through every
              stage on the device with the elbow tutorial.
            </p>

            <dl className="mt-10 grid max-w-xl grid-cols-2 border-t border-hair">
              {facts.map((m) => (
                <div
                  key={m.label}
                  className="border-b border-hair py-6 odd:border-r odd:pr-6 even:pl-6"
                >
                  <dt className="label text-ink-faint">{m.label}</dt>
                  <dd className="font-display tabular mt-3 text-5xl leading-none">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={publication.recordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid-ink"
              >
                Read the paper
                <span className="sr-only"> (opens Zenodo in a new tab)</span>
                <Arrow className="btn-arrow" />
              </a>
              <a
                href={publication.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ink"
              >
                DOI {publication.doi}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <p className="label mt-6 text-ink-faint">
              A feasibility study: one device, one tutorial case. Downloads
              counted across versions on Zenodo, {zenodoDate}.
            </p>
          </Reveal>

          <Reveal delay={120} className="justify-self-center lg:justify-self-end">
            <ResearchPhone courant={publication.facts.courantBelow} />
            <p className="label mt-6 text-center text-ink-faint">
              Schematic, not a recording
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------- 02 · the workbench */}
      <section
        id="open-capiq-workbench"
        className="band relative scroll-mt-16 border-t border-hair"
      >
        <div className="mx-auto grid max-w-6xl gap-x-20 gap-y-16 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <SectionLabel n="02" className="text-ink-faint">
              Project
            </SectionLabel>
            <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
              {workbench.title}.
            </h2>
            <p className="font-read mt-6 text-xl italic text-ink-soft">
              Open data and the core valuation methods, working in the browser.
            </p>
            <p className="label mt-3 text-ink-faint">
              Project · One page · Runs in the browser
            </p>
            <p className="mt-7 max-w-xl text-lg leading-[1.65] text-ink-soft">
              {workbench.summary}
            </p>

            <dl className="mt-10 grid max-w-xl grid-cols-2 border-t border-hair">
              {workbenchFacts.map((m) => (
                <div
                  key={m.label}
                  className="border-b border-hair py-6 odd:border-r odd:pr-6 even:pl-6"
                >
                  <dt className="label text-ink-faint">{m.label}</dt>
                  <dd className="font-display tabular mt-3 text-5xl leading-none">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a href={workbenchUrl} className="btn btn-solid-ink">
                Open the workbench
                <Arrow className="btn-arrow" />
              </a>
              <a
                href={workbench.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ink"
              >
                Code on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <p className="label mt-6 text-ink-faint">
              Educational use only, not investment advice. The peer data in the
              comps tool is fictional.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <p className="label text-ink-faint">What is inside, tab by tab</p>
            <ul className="mt-5 border-b border-hair">
              {workbench.tabs.map((t) => (
                <li key={t.id}>
                  <a
                    href={`${workbenchUrl}#${t.id}`}
                    className="group flex items-start justify-between gap-6 border-t border-hair py-5"
                  >
                    <span>
                      <span className="font-display block text-xl leading-tight">
                        {t.name}
                      </span>
                      <span className="mt-2 block max-w-[30em] text-sm leading-relaxed text-ink-soft">
                        {t.detail}
                      </span>
                    </span>
                    <Arrow className="mt-2 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink motion-reduce:transition-none" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------- 03 · around the paper */}
      {related.length > 0 && (
        <section className="on-paper border-t border-hair">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <SectionLabel n="03" className="text-ink-faint">
                Programmes
              </SectionLabel>
              <h2 className="font-display mt-6 max-w-2xl text-[clamp(2rem,4.4vw,3rem)] leading-[1.06]">
                Research programmes and recognition.
              </h2>
            </Reveal>

            <ul className="mt-12 border-b border-hair">
              {related.map((r, i) => (
                <Reveal as="li" key={r.title} delay={i * 50}>
                  <div className="grid gap-x-10 gap-y-3 border-t border-hair py-8 md:grid-cols-[9rem_1fr]">
                    <p className="label tabular text-ink-faint md:pt-1.5">
                      {r.period}
                    </p>
                    <div>
                      <h3 className="font-display text-2xl leading-tight">
                        {r.title}
                      </h3>
                      <p className="label mt-2 text-ink-faint">{r.org}</p>
                      <p className="mt-4 max-w-[32em] leading-relaxed text-ink-soft">
                        {r.detail}
                      </p>
                      {r.url && (
                        <p className="mt-4">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="label ref hit text-ink-soft"
                          >
                            {r.linkLabel ?? "Reference"}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
