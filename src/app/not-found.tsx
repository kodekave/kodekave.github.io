import Link from "next/link";
import Arrow from "@/components/Arrow";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import LostInCurve from "@/components/LostInCurve";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * The page for an address that is not on the site: the same chrome as every
 * other page, a live Lorenz butterfly with a point wandering it (see
 * LostInCurve), and one way back.
 */
export default function NotFound() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" className="relative isolate flex-1">
        <section className="relative min-h-[40rem] overflow-hidden md:min-h-[40rem]">
          <LostInCurve />
          <div className="settle relative mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pb-44 md:pt-28">
            <p className="label label-dot text-ink-faint">404</p>
            <h1 className="font-display mt-8 max-w-[7em] text-[clamp(2.8rem,6.6vw,5.6rem)] leading-[1.02]">
              Lost in the curve.
            </h1>
            <p className="font-display-text mt-6 text-[1.25rem] text-ink-soft">
              This page could not be found.
            </p>
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
