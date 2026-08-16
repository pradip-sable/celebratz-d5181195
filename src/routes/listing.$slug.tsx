import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/listing/$slug")({
  component: Listing,
});

function Listing() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-muted-foreground">Listing detail coming soon.</p>
    </div>
  );
}
