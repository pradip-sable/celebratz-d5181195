import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Celebratz" },
      { name: "description", content: "Learn about Celebratz, Pune's marketplace for discovering and comparing venues and services for celebrations." },
      { property: "og:title", content: "About Celebratz" },
      { property: "og:description", content: "Learn about Celebratz, Pune's marketplace for discovering and comparing venues and services for celebrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="font-serif text-3xl font-semibold">About Celebratz</h1>
      <p className="mt-4 leading-relaxed text-foreground/90">
        Celebratz is a marketplace for discovering and comparing venues and services for celebrations in Pune. Whether you are planning a wedding, birthday, engagement, naming ceremony or corporate event, we help you find banquet halls, photographers, caterers, decorators, DJs and pandits in one place.
      </p>
      <p className="mt-4 leading-relaxed text-foreground/90">
        We are not a checkout platform. You browse, compare, check availability and send a request or enquiry. The vendor then contacts you directly to finalise details, pricing and contracts in person.
      </p>
      <p className="mt-4 leading-relaxed text-foreground/90">
        Celebratz is currently focused on Pune and is operated by Celebratz (business registration in progress). For support, reach us at celebratz@gmail.com.
      </p>
    </div>
  );
}
