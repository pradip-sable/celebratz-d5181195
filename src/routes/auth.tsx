import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { AuthModal } from "@/components/AuthModal";

const authSearchSchema = z.object({
  returnTo: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  type: z.enum(["customer", "vendor", "admin"]).optional(),
});

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in | Celebratz" },
      { name: "description", content: "Sign in or create a Celebratz account to manage your celebrations in Pune." },
      { property: "og:title", content: "Sign in | Celebratz" },
      { property: "og:description", content: "Sign in or create a Celebratz account to manage your celebrations in Pune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const returnTo = typeof search.returnTo === "string" ? search.returnTo : "/";
  const initialMode = search.mode === "signup" ? "signup" : "login";
  const initialRole = search.type ?? "customer";

  return (
    <AuthModal
      asPage
      returnTo={returnTo}
      initialMode={initialMode}
      initialRole={initialRole}
    />
  );
}
