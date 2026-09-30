import { createFileRoute } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Mail } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Celebratz" },
      {
        name: "description",
        content:
          "Learn about Celebratz, Pune's marketplace for discovering and comparing venues and services for celebrations.",
      },
      { property: "og:title", content: "About Celebratz" },
      {
        property: "og:description",
        content:
          "Learn about Celebratz, Pune's marketplace for discovering and comparing venues and services for celebrations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function About() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 text-foreground text-left pb-24">
      {/* Hero */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
          About Celebratz &bull; Pune
        </span>
        <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-foreground">
          Making Pune Celebrations Joyful &amp; Transparent
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-2xl leading-relaxed">
          Planning a wedding, milestone birthday, engagement, or naming ceremony should be about joy
          &mdash; not endless phone calls, hidden charges, or stressful weekend traffic across Pune.
          Celebratz brings Pune&rsquo;s best celebration spaces and trusted service masters into one
          transparent comparison platform.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-card rounded-2xl border border-border space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-serif font-bold text-base text-foreground">Rooted in Pune</h3>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            From the grand banquet lawns of Baner and Bavdhan to boutique riverside spaces in
            Koregaon Park and Kalyani Nagar, our data is tailored to Pune localities and real
            pricing standards.
          </p>
        </div>

        <div className="p-5 bg-card rounded-2xl border border-border space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent-dark flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-serif font-bold text-base text-foreground">Direct &amp; Unbiased</h3>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            No middleman fees, no inflated quotes. You connect directly with venue owners and
            vendors to visit in person and negotiate your contracts with complete peace of mind.
          </p>
        </div>
      </div>

      {/* Contact & Support Box */}
      <div className="bg-muted/40 rounded-3xl p-6 sm:p-8 border border-border/80 space-y-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-foreground">
            Get in Touch with Celebratz
          </h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Have a question, feedback, or want to list your Pune business? Reach us directly via
            email:
          </p>
        </div>

        <div className="pt-2">
          <a
            href="mailto:celebratzapp@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4 text-accent" />
            <span>Email celebratzapp@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
