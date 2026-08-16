import { createFileRoute } from "@tanstack/react-router";

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
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-serif text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN")}</p>
      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
        <p>
          Celebratz (“we”, “us”) operates the Celebratz marketplace. This Privacy Policy explains how we collect, use and share personal information when you use our website.
        </p>
        <h2 className="font-serif text-xl font-semibold">Information we collect</h2>
        <p>
          When you create an account, we collect your name and email address. When you submit a booking request or enquiry, we collect your name and phone number so the vendor can contact you.
        </p>
        <h2 className="font-serif text-xl font-semibold">How we use your information</h2>
        <p>
          We use your information to operate the marketplace, share leads with relevant vendors, send you notifications about your requests and improve our services.
        </p>
        <h2 className="font-serif text-xl font-semibold">Sharing your information</h2>
        <p>
          When you send a request or enquiry to a vendor, we share your name and phone number with that vendor. We do not sell your personal information to third parties.
        </p>
        <h2 className="font-serif text-xl font-semibold">Contact us</h2>
        <p>
          For privacy questions, email us at <a href="mailto:celebratz@gmail.com" className="text-primary hover:underline">celebratz@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
