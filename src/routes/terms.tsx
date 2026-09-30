import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of Service | Celebratz" },
      { name: "description", content: "Celebratz terms of service." },
      { property: "og:title", content: "Terms of Service | Celebratz" },
      { property: "og:description", content: "Celebratz terms of service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 text-foreground text-left pb-24">
      <div className="border-b border-border pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
          Legal & Trust &bull; Pune Launch
        </span>
        <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-foreground mt-1">
          Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: August 2026</p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-foreground font-light">
        <section className="space-y-2">
          <h3 className="font-bold text-base text-foreground">
            1. Nature of the Marketplace Platform
          </h3>
          <p>
            Celebratz serves solely as an information, discovery, comparison, and lead transmission
            bridge between prospective event hosts and independent vendor businesses in Pune, India.
          </p>
        </section>

        <section className="space-y-2 p-4 bg-muted border border-border/80 rounded-2xl">
          <h3 className="font-bold text-base text-foreground">
            2. No In-App Financial Transactions / Offline Contracting
          </h3>
          <p className="text-xs text-foreground font-medium">
            Celebratz does not process advance booking payments, security deposits, or digital
            payment checkouts for event venues or vendor services.
          </p>
          <p className="text-xs text-muted-foreground">
            All price negotiations, physical site inspections, service contracts, cancellation
            policies, and monetary exchanges occur directly and privately between the customer and
            the vendor outside the Celebratz web app.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-base text-foreground">
            3. Availability Calendar Disclaimers
          </h3>
          <p>
            Availability statuses (Available, Tentative, Booked) and pricing tiers are maintained
            directly by registered vendors. Celebratz prominently displays a &ldquo;Last updated X
            days ago&rdquo; indicator and flags stale calendars to assist users, but cannot
            guarantee venue availability if vendor updates lag.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-base text-foreground">4. User Conduct & Inquiries</h3>
          <p>
            Customers agree to provide genuine contact details and valid celebration requirements
            when requesting bookings or enquiries.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-base text-foreground">5. Support & Inquiries</h3>
          <p>
            For support inquiries or vendor onboarding assistance, please email{" "}
            <a href="mailto:celebratzapp@gmail.com" className="text-primary font-bold underline">
              celebratzapp@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
