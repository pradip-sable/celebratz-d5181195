import { createFileRoute } from "@tanstack/react-router";
import { ComparisonView } from "@/components/ComparisonBar";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare Listings | Celebratz" },
      {
        name: "description",
        content: "Compare celebration venues and services in Pune side-by-side.",
      },
      { property: "og:title", content: "Compare Listings | Celebratz" },
      {
        property: "og:description",
        content: "Compare celebration venues and services in Pune side-by-side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:py-12">
      <ComparisonView />
    </div>
  );
}
