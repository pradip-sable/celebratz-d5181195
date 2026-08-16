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
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-serif text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN")}</p>
      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
        <p>
          By using Celebratz, you agree to these Terms of Service. If you do not agree, please do not use the platform.
        </p>
        <h2 className="font-serif text-xl font-semibold">Service description</h2>
        <p>
          Celebratz is a discovery and lead-generation marketplace. We do not process payments or guarantee bookings. All pricing, contracts and payments are negotiated directly between you and the vendor.
        </p>
        <h2 className="font-serif text-xl font-semibold">User accounts</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
        </p>
        <h2 className="font-serif text-xl font-semibold">Vendor listings</h2>
        <p>
          Vendor listings are reviewed before going live. We reserve the right to remove listings that violate our policies or mislead users.
        </p>
        <h2 className="font-serif text-xl font-semibold">Contact</h2>
        <p>
          For questions about these terms, email <a href="mailto:celebratz@gmail.com" className="text-primary hover:underline">celebratz@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
