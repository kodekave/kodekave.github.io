import Link from "next/link";
import Arrow from "@/components/Arrow";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Pattern from "@/components/Pattern";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * The page for an address that is not on the site: the same chrome as every
 * other page, the Lorenz butterfly behind it, and one way back.
 */
export default function NotFound() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" className="relative isolate flex-1">
        <section className="relative overflow-hidden">
          <Pattern kind="lorenz" />
          <div className="settle relative mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pb-44 md:pt-28">
            <p className="label label-dot text-ink-faint">404</p>
            <h1 className="font-display mt-8 max-w-[12em] text-[clamp(2.6rem,6vw,5rem)] leading-[1.03]">
              This page could not be found.
            </h1>
            <div className="mt-10">
              <Link href="/" className="btn btn-ink">
                Back to the start
                <Arrow className="btn-arrow" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
