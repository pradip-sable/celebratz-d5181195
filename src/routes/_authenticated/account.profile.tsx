import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Heart,
  Loader2,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile, devVerifyPhone, getMyRequests } from "@/lib/dashboard.functions";
import { getWishlist, getMyReviewData } from "@/lib/engagement.functions";
import { CustomerShell } from "@/components/CustomerShell";
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
  const fetchRequests = useServerFn(getMyRequests);
  const fetchWishlist = useServerFn(getWishlist);
  const fetchReviews = useServerFn(getMyReviewData);

  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => fetchRequests(),
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => fetchWishlist(),
  });

  const { data: reviewData } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => fetchReviews(),
  });

  const pendingRequestsCount = requests.filter((r: any) => r.status === "new").length;
  const reviewsCount = reviewData?.reviews?.length ?? 0;

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
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: () => verifyPhone({ data: { code } }),
    onSuccess: () => {
      toast.success("Phone verified");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <CustomerShell>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Quick Hub Navigation Cards */}
          <div>
            <h2 className="font-serif font-bold text-xl text-foreground mb-3">My Activity & Shortcuts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: My Requests */}
              <Link
                to="/dashboard"
                className="bg-card rounded-3xl border border-border p-5 text-left hover:border-primary/40 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center border border-border-subtle">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      My Requests
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {requests.length} booking enquiries &bull; {pendingRequestsCount} pending
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 2: My Wishlist */}
              <Link
                to="/wishlist"
                className="bg-card rounded-3xl border border-border p-5 text-left hover:border-destructive/30 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-destructive-subtle text-destructive flex items-center justify-center border border-destructive/20">
                    <Heart className="w-6 h-6 fill-destructive text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-destructive transition-colors">
                      My Wishlist
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {wishlist.length} saved venues & vendors
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-destructive group-hover:text-destructive-foreground flex items-center justify-center transition-colors text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 3: My Reviews */}
              <Link
                to="/reviews"
                className="bg-card rounded-3xl border border-border p-5 text-left hover:border-accent hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-accent-subtle text-accent flex items-center justify-center border border-accent/30">
                    <Star className="w-6 h-6 fill-accent text-accent" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-accent transition-colors">
                      My Reviews
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {reviewsCount} reviews published
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-accent group-hover:text-accent-foreground flex items-center justify-center transition-colors text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 4: Explore Pune Vendors */}
              <Link
                to="/search"
                className="bg-card rounded-3xl border border-border p-5 text-left hover:border-border hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-muted text-foreground flex items-center justify-center border border-border">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground group-hover:text-foreground transition-colors">
                      Explore Vendors
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Search Pune venues, caterers & decorators
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-foreground group-hover:text-background flex items-center justify-center transition-colors text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
            <h2 className="font-serif font-bold text-xl text-foreground">Personal Information</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (current.phone !== current.phoneConfirm) {
                  toast.error("Phone numbers do not match");
                  return;
                }
                save.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-colors">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    required
                    value={current.full_name}
                    onChange={(e) => setForm({ ...current, full_name: e.target.value })}
                    className="w-full bg-transparent text-xs text-foreground font-medium outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email ?? ""}
                    className="w-full bg-muted border border-border rounded-xl p-2.5 text-xs text-muted-foreground font-medium outline-hidden cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Primary Phone Number (+91)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 focus-within:border-primary focus-within:bg-card transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      required
                      type="tel"
                      value={current.phone}
                      onChange={(e) => setForm({ ...current, phone: e.target.value })}
                      placeholder="+91 98230 45678"
                      className="w-full bg-transparent text-xs text-foreground font-medium outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Confirm Phone Number
                </label>
                <input
                  required
                  type="tel"
                  value={current.phoneConfirm}
                  onChange={(e) => setForm({ ...current, phoneConfirm: e.target.value })}
                  placeholder="Type phone number again"
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium outline-hidden focus:border-primary focus:bg-card transition-colors"
                />
              </div>

              {profile?.phone_verified_at && (
                <div className="p-3 bg-muted/60 rounded-2xl border border-border flex items-start gap-2.5 text-xs text-foreground">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong>Phone Verification Active</strong>: Your phone number is shared only with vendors whose listings you request, ensuring transparent communication for date holds and quotes.
                  </span>
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl text-xs font-bold" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save Personal Details"}
              </Button>
            </form>
          </div>

          {/* Phone Verification Section */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className={`h-5 w-5 ${profile?.phone_verified_at ? "text-success" : "text-muted-foreground"}`} />
              <h2 className="font-serif text-lg font-semibold text-foreground">Phone Verification Status</h2>
            </div>
            {profile?.phone_verified_at ? (
              <p className="text-xs text-muted-foreground">
                Verified on {new Date(profile.phone_verified_at).toLocaleDateString("en-IN")}.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  SMS OTP is not live yet. While we complete SMS registration, use the dev code{" "}
                  <span className="font-mono font-semibold text-foreground">000000</span> to mark your number verified.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground outline-hidden focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-xs font-bold"
                    disabled={verify.isPending || !profile?.phone}
                    onClick={() => verify.mutate()}
                  >
                    Verify
                  </Button>
                </div>
                {!profile?.phone && (
                  <p className="text-xs text-muted-foreground">Save a phone number first.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
