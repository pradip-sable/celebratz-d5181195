import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact Celebratz" },
      { name: "description", content: "Get in touch with Celebratz for support, vendor enquiries or feedback." },
      { property: "og:title", content: "Contact Celebratz" },
      { property: "og:description", content: "Get in touch with Celebratz for support, vendor enquiries or feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-serif text-3xl font-semibold">Contact us</h1>
      <p className="mt-4 leading-relaxed text-foreground/90">
        Have a question, suggestion or need help with a vendor? We would love to hear from you.
      </p>
      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="font-medium">Email</p>
        <a href="mailto:celebratz@gmail.com" className="mt-1 text-primary hover:underline">celebratz@gmail.com</a>
        <p className="mt-6 font-medium">Location</p>
        <p className="mt-1 text-muted-foreground">Pune, Maharashtra, India</p>
      </div>
    </div>
  );
}
