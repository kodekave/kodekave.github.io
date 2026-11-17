import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PatternTrail from "@/components/PatternTrail";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* The first thing a keyboard reaches: past the navigation, to the page. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      {/* `isolate` makes main its own stacking context, so the pattern trail
          can sit behind the page's content and in front of the page's paper. */}
      <main id="main" tabIndex={-1} className="relative isolate flex-1 focus:outline-none">
        <PatternTrail />
        {children}
      </main>
      <Footer />
    </>
  );
}
