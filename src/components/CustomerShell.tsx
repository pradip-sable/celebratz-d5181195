import React, { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyRequests } from "@/lib/dashboard.functions";
import { getWishlist, getMyReviewData } from "@/lib/engagement.functions";

interface CustomerShellProps {
  children: React.ReactNode;
}

export function CustomerShell({ children }: CustomerShellProps) {
  const { pathname } = useLocation();

  const fetchProfile = useServerFn(getMyProfile);
  const fetchRequests = useServerFn(getMyRequests);
  const fetchWishlist = useServerFn(getWishlist);
  const fetchReviews = useServerFn(getMyReviewData);

  const { data: profile } = useQuery({
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

  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setAuthEmail(data.user.email);
      }
    });
  }, []);

  const fullName = profile?.full_name?.trim() || "Customer";
  const initials =
    fullName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  const displayEmail = profile?.email || authEmail || "Your account";
  const displayPhone = profile?.phone || "Mobile number entered on first enquiry";

  const isRequestsActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isWishlistActive = pathname === "/wishlist" || pathname.startsWith("/wishlist/");
  const isReviewsActive = pathname === "/reviews" || pathname.startsWith("/reviews/");
  const isProfileActive = pathname === "/account/profile" || pathname.startsWith("/account/profile/");

  const requestsCount = requests.length;
  const wishlistCount = wishlist.length;
  const reviewsCount = reviewData?.reviews?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20 sm:px-6 md:py-10 space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-border flex items-center justify-center text-primary font-bold text-xl uppercase shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-foreground">{fullName}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-border-subtle">
                Customer
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {displayEmail} &bull; {displayPhone}
            </p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted rounded-2xl w-full sm:w-auto text-xs font-semibold">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-xl transition-all ${
              isRequestsActive
                ? "bg-card text-primary shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Requests ({requestsCount})
          </Link>
          <Link
            to="/wishlist"
            className={`px-4 py-2 rounded-xl transition-all ${
              isWishlistActive
                ? "bg-card text-primary shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Wishlist ({wishlistCount})
          </Link>
          <Link
            to="/reviews"
            className={`px-4 py-2 rounded-xl transition-all ${
              isReviewsActive
                ? "bg-card text-primary shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Reviews ({reviewsCount})
          </Link>
          <Link
            to="/account/profile"
            className={`px-4 py-2 rounded-xl transition-all ${
              isProfileActive
                ? "bg-card text-primary shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Profile
          </Link>
        </div>
      </div>

      {/* Route Content */}
      {children}
    </div>
  );
}
