import Reveal from "@/components/Reveal";
import type { Faq } from "@/lib/posts";

/**
 * Renders question-and-answer pairs as a description list.
 *
 * Paired with `faqSchema()` in the page's JSON-LD. Answer engines and
 * featured snippets extract short, self-contained answers rather than whole
 * pages, so each answer is written to stand alone without the question.
 */
export default function FaqSection({
  faqs,
  id = "faq",
  heading = "Common questions",
}: {
  faqs: Faq[];
  id?: string;
  heading?: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby={id} className="grain border-t border-hair bg-mist">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Reveal>
          <h2 id={id} className="label text-ink-faint">
            {heading}
          </h2>
          <dl className="mt-10">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-t border-hair py-7">
                <dt className="font-display-text text-xl leading-snug">
                  {faq.q}
                </dt>
                <dd className="mt-3 leading-[1.75] text-ink-soft">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
