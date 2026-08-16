import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
  component: Search,
});

function Search() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-muted-foreground">Search results coming soon.</p>
    </div>
  );
}
