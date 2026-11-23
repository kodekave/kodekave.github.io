import Masthead from "@/components/Masthead";
import { profile } from "@/lib/content";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLdGraph,
  jsonLdScript,
} from "@/lib/seo";

export const metadata = buildMetadata({
  path: "/privacy",
  title: "Privacy Policy: What This Site Collects",
  description:
    "What komalkedarnath.wiki collects: no analytics, no cookies, one saved light or dark choice, and a newsletter that hands off to Substack.",
});

/**
 * The privacy policy. Short because the site does very little: it has no
 * analytics, no cookies of its own and no third-party scripts, and the only
 * thing it stores is the visitor's light or dark choice, in their own browser.
 * If that changes (an analytics script, an embed, a form that posts somewhere),
 * this page has to change with it, and so does the date at the foot.
 */
export default function PrivacyPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Privacy", path: "/privacy" },
            ])
          )
        )}
      />

      <Masthead
        label="Privacy"
        breadcrumb={[{ name: "Home", href: "/" }, { name: "Privacy" }]}
        title={<>Privacy policy.</>}
        lead={
          <>
            This site collects almost nothing about you. This page says what it
            does and what it doesn&rsquo;t.
          </>
        }
      />

      <section className="on-paper">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="prose-post">
            <h2>Who runs this site</h2>
            <p>
              komalkedarnath.wiki is run by me, {profile.name}, from India. If
              anything on this page is unclear, or you want something of yours
              removed, email me at{" "}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>.
            </p>

            <h2>What the site collects</h2>
            <p>
              Nothing that identifies you. The site has no analytics, no
              advertising or tracking scripts and no cookies of its own, and it
              loads nothing from other companies&rsquo; servers. Every file on
              every page comes from this domain.
            </p>

            <h2>Where it is hosted</h2>
            <p>
              The site is hosted on GitHub Pages. When a page loads, GitHub&rsquo;s
              servers see your IP address and browser details, as any web
              host&rsquo;s do, and GitHub handles that under its{" "}
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy statement
              </a>
              . I don&rsquo;t collect or use that information.
            </p>

            <h2>What stays on your device</h2>
            <p>
              The switch in the top bar sets the light or dark page. Your choice
              is saved in your browser, under the name <code>theme</code>, so the
              site opens the way you left it. It never leaves your device, and
              clearing your browser&rsquo;s site data removes it. Until you
              choose, the site follows your device&rsquo;s light or dark setting.
            </p>
            <p>
              The time on the home page is the time in India, worked out in your
              browser. The site doesn&rsquo;t look up where you are.
            </p>

            <h2>The newsletter</h2>
            <p>
              The newsletter runs on Substack. When you type your address into
              the form here and press Subscribe, your browser goes to
              Substack&rsquo;s subscribe page with the address filled in, and you
              confirm it there. This site doesn&rsquo;t receive or store the
              address. From then on Substack holds it, under{" "}
              <a
                href="https://substack.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Substack&rsquo;s privacy policy
              </a>
              , and I can see my subscriber list there. Every issue has an
              unsubscribe link.
            </p>

            <h2>If you email me</h2>
            <p>
              Your message and address reach me through my email provider. I use
              them to reply and for nothing else, and I don&rsquo;t add anyone to
              a list who hasn&rsquo;t asked to be on it.
            </p>

            <h2>Links to other sites</h2>
            <p>
              Pages here link to LinkedIn, GitHub, ORCID, Zenodo and other sites.
              Each has its own privacy policy, and what they collect after you
              leave this site is up to them.
            </p>

            <h2>Your details</h2>
            <p>
              Because the site keeps no personal data about visitors, there is
              usually nothing to look up or delete. If you subscribed or wrote to
              me and want your details gone, email me and I will delete them, or
              use the unsubscribe link in any issue.
            </p>

            <h2>Changes</h2>
            <p>
              If this changes, I will update this page and the date.
            </p>
            <p>Last updated: 23 November 2026.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
