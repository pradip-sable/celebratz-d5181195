import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile, devVerifyPhone } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({
    meta: [
      { title: "My profile | Celebratz" },
      { name: "description", content: "Update your name and phone number used for booking requests." },
      { property: "og:title", content: "My profile | Celebratz" },
      { property: "og:description", content: "Update your name and phone number used for booking requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const verifyPhone = useServerFn(devVerifyPhone);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const [form, setForm] = useState<{ full_name: string; phone: string; phoneConfirm: string } | null>(null);
  const [code, setCode] = useState("");

  const current = form ?? {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    phoneConfirm: profile?.phone ?? "",
  };

  const save = useMutation({
    mutationFn: () => saveProfile({ data: { full_name: current.full_name, phone: current.phone } }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: () => verifyPhone({ data: { code } }),
    onSuccess: () => {
      toast.success("Phone verified");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-16">
      <h1 className="font-serif text-2xl font-semibold">My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (current.phone !== current.phoneConfirm) {
            toast.error("Phone numbers do not match");
            return;
          }
          save.mutate();
        }}
        className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <input
              required
              value={current.full_name}
              onChange={(e) => setForm({ ...current, full_name: e.target.value })}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone number</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="tel"
              value={current.phone}
              onChange={(e) => setForm({ ...current, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Confirm phone number</label>
          <input
            required
            type="tel"
            value={current.phoneConfirm}
            onChange={(e) => setForm({ ...current, phoneConfirm: e.target.value })}
            placeholder="Type phone number again"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save profile"}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <BadgeCheck className={`h-5 w-5 ${profile?.phone_verified_at ? "text-emerald-600" : "text-muted-foreground"}`} />
          <h2 className="font-serif text-lg font-semibold">Phone verification</h2>
        </div>
        {profile?.phone_verified_at ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Verified on {new Date(profile.phone_verified_at).toLocaleDateString("en-IN")}.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              SMS OTP is not live yet. While we complete SMS registration, use the dev code{" "}
              <span className="font-mono font-semibold text-foreground">000000</span> to mark your number verified.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={verify.isPending || !profile?.phone}
                onClick={() => verify.mutate()}
              >
                Verify
              </Button>
            </div>
            {!profile?.phone && (
              <p className="mt-2 text-xs text-muted-foreground">Save a phone number first.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
