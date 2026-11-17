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
      <Nav />
      {/* `isolate` makes main its own stacking context, so the pattern trail
          can sit behind the page's content and in front of the page's paper. */}
      <main className="relative isolate flex-1">
        <PatternTrail />
        {children}
      </main>
      <Footer />
    </>
  );
}
