import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Mail, User, Loader2 } from "lucide-react";

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
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [accountType, setAccountType] = useState<"customer" | "vendor" | "admin">(search.type ?? "customer");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Temporary: no password step yet. The email alone identifies the user, and we
  // derive a stable internal credential from it so auth still works end to end.
  const derivedPassword = (value: string) => `celebratz::${value.trim().toLowerCase()}`;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const password = derivedPassword(email);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Check your email to confirm your account.");
          return;
        }
      }

      window.location.href = returnTo;
    } catch (err: any) {
      setError(err.message ?? "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };


  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed.");
      setLoading(false);
    }
    // If redirected, the browser is navigating away.
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "Join Celebratz to plan your celebrations." : "Sign in to manage your bookings and listings."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-8 w-full rounded-xl"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
          <span className="bg-background px-2">or use email</span>
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}
      {message && (
        <div className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
      )}

      <form onSubmit={handleEmail} className="mt-6 space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full name</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {(["customer", "vendor", "admin"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize ${accountType === type ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full rounded-xl">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Create account" : "Continue"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          No password needed for now — your email identifies your account.
        </p>

      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="font-medium text-primary hover:underline"
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}
