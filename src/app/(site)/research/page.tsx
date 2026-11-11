import Arrow from "@/components/Arrow";
import Masthead from "@/components/Masthead";
import ResearchPhone from "@/components/ResearchPhone";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import { publication, recognition } from "@/lib/content";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/research",
  title: "Research: Running OpenFOAM on Android — Komal Kedarnath",
  description:
    "Published research by Komal Kedarnath: a workflow study of running OpenFOAM CFD on an Android phone (FOSSEE, IIT Bombay), with related research programmes.",
});

/**
 * Research and projects.
 *
 * The published study leads, drawn as the object it is about. Below it sits
 * the research it grew out of. New papers and projects are added as further
 * sections here, so the homepage stays short and links in.
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
        label="Research"
        ghost="Research"
        title={<>Research and projects.</>}
        lead={<>One published study, and the research programmes around it.</>}
      />

      {/* --------------------------------------------------- 01 · the paper */}
      <section
        id="openfoam-on-android"
        className="on-paper grain relative scroll-mt-16 overflow-hidden"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-x-20 gap-y-16 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <SectionLabel n="01" className="text-ink-faint">
              Published
            </SectionLabel>
            <h2 className="font-display mt-6 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04]">
              CFD on a phone.
            </h2>
            <p className="font-display-text mt-6 text-xl italic text-ink-soft">
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

      {/* ---------------------------------------------- 02 · around the paper */}
      {related.length > 0 && (
        <section className="grain border-t border-hair bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <SectionLabel n="02" className="text-ink-faint">
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
                      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                        {r.detail}
                      </p>
                      {r.url && (
                        <p className="mt-4">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="label ref text-ink-soft"
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
