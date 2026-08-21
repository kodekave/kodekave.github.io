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
    <Reveal delay={80}>
      <section
        aria-labelledby={id}
        className="mt-16 border-t border-line pt-10"
      >
        <h2 id={id} className="font-display text-2xl text-ink">
          {heading}
        </h2>
        <dl className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-display text-lg text-ink">{faq.q}</dt>
              <dd className="mt-2 leading-relaxed text-ink-soft">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Reveal>
  );
}
