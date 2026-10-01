import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy | Celebratz" },
      { name: "description", content: "Celebratz privacy policy." },
      { property: "og:title", content: "Privacy Policy | Celebratz" },
      { property: "og:description", content: "Celebratz privacy policy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 text-foreground text-left pb-24">
      <div className="border-b border-border pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
          Legal & Trust &bull; Pune Launch
        </span>
        <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-foreground mt-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: August 2026</p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-foreground font-light">
        <section className="space-y-2">
          <h3 className="font-sans font-bold text-base text-foreground">1. Introduction & Role</h3>
          <p>
            Welcome to <strong>Celebratz</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;). Celebratz is an event venue and service discovery marketplace based
            in Pune, India. We connect event planners and families with vetted banquet halls,
            caterers, photographers, decorators, DJs, and Vedic pandits.
          </p>
        </section>

        <section className="space-y-2 p-4 bg-accent-subtle/50 border border-accent/30 rounded-2xl">
          <h3 className="font-sans font-bold text-base text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            2. Customer Contact Sharing with Vendors
          </h3>
          <p className="text-xs text-foreground font-medium">
            When you submit a <strong>&ldquo;Request to Book&rdquo;</strong> or{" "}
            <strong>&ldquo;General Enquiry&rdquo;</strong> form on Celebratz, you explicitly consent
            to sharing your full name, email address, event date requirements, and 10-digit mobile
            number directly with the specific vendor you are contacting.
          </p>
          <p className="text-xs text-muted-foreground">
            This information enables the vendor to follow up with you regarding walkthrough
            appointments, date availability, and final pricing outside the application. We never
            sell your personal details to third-party ad networks or unsolicited telemarketers.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-sans font-bold text-base text-foreground">
            3. Information We Collect
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>
              <strong>Account Details:</strong> Name, email address, profile avatar, and verified or
              double-entered phone numbers.
            </li>
            <li>
              <strong>Event Specifics:</strong> Event type (Wedding, Engagement, Birthday, Naming
              Ceremony, Corporate Event), event dates, estimated guest count, and custom notes.
            </li>
            <li>
              <strong>Vendor Data:</strong> Business name, Pune locality, capacity specs, pricing
              tiers, and calendar availability entries.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-sans font-bold text-base text-foreground">4. Data Security</h3>
          <p>
            We implement strict access controls and encrypted communication protocols to safeguard
            all client and vendor data stored within our Pune marketplace infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-sans font-bold text-base text-foreground">
            5. Contact Our Privacy Team
          </h3>
          <p>
            If you have questions about your stored data, account deletion, or vendor privacy
            protocols, reach out directly to our team at{" "}
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
