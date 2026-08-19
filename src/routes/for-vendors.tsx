import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Inbox, Megaphone, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/for-vendors")({
  head: () => {
    const title = "List your venue or service | Celebratz for Vendors";
    const description =
      "Get discovered by families planning weddings, birthdays and corporate events in Pune. Free listings, direct leads, no commission.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ForVendorsPage,
});

const BENEFITS = [
  { icon: Megaphone, title: "Get discovered", body: "Appear in searches by area, event type, budget and date across Pune." },
  { icon: Inbox, title: "Direct leads", body: "Booking requests and enquiries land in your dashboard with the customer's phone number." },
  { icon: CalendarCheck, title: "Own your calendar", body: "Tap to mark dates Available, Tentative or Booked — customers see how fresh it is." },
  { icon: ShieldCheck, title: "No commission", body: "We don't take payments or cuts. You negotiate and close directly with the customer." },
];

function ForVendorsPage() {
  return (
    <div className="pb-28 md:pb-16">
      <section className="bg-primary/5 px-4 py-14 text-center">
        <h1 className="mx-auto max-w-2xl font-serif text-3xl font-semibold md:text-4xl">
          Fill your calendar with Pune's celebrations
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          List your venue, catering, photography, decor, music or priest services on Celebratz and receive
          enquiries from people actively planning their event.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ mode: "signup", type: "vendor" }}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            List your business — free
          </Link>
          <Link to="/vendor" className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold">
            Vendor sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <b.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-serif text-lg font-semibold">{b.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <h2 className="font-serif text-xl font-semibold">How it works</h2>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li><span className="font-medium text-foreground">1. Create your vendor account</span> — takes about a minute.</li>
          <li><span className="font-medium text-foreground">2. Add your business details</span> — we review and approve new vendors manually.</li>
          <li><span className="font-medium text-foreground">3. Publish listings</span> — category-specific details, photos, pricing and event types.</li>
          <li><span className="font-medium text-foreground">4. Respond to leads</span> — accept or decline requests, then close the deal your way.</li>
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Email us at{" "}
          <a href="mailto:celebratz@gmail.com" className="font-medium text-primary">celebratz@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
