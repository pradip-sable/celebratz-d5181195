import React, { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Home, Search, CalendarCheck, Heart, User, Store, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRequests } from "@/lib/dashboard.functions";
import { getVendorLeads } from "@/lib/vendor.functions";
import { getWishlist } from "@/lib/engagement.functions";

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const [session, setSession] = useState<any>(null);

  const fetchMyRequests = useServerFn(getMyRequests);
  const fetchVendorLeads = useServerFn(getVendorLeads);
  const fetchWishlist = useServerFn(getWishlist);

  // Track Supabase Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  // Query real user role from database (shares query key with Navbar.tsx for cache deduplication)
  const { data: roleData } = useQuery({
    queryKey: ["user-role", userId],
    queryFn: async () => {
      if (!userId) return "customer";
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !data?.role) return "customer";
      return data.role;
    },
    enabled: Boolean(userId),
  });

  const userRole = roleData ?? "customer";

  // Pending Customer Requests Badge (status === "new")
  const { data: myRequestsData } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => fetchMyRequests(),
    enabled: Boolean(userId && userRole === "customer"),
    staleTime: 30_000,
    retry: false,
  });

  // Pending Vendor Leads Badge (status === "new")
  const { data: vendorLeadsData } = useQuery({
    queryKey: ["vendor-leads"],
    queryFn: () => fetchVendorLeads(),
    enabled: Boolean(userId && userRole === "vendor"),
    staleTime: 30_000,
    retry: false,
  });

  // Customer Wishlist Count Badge
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => fetchWishlist(),
    enabled: Boolean(userId && userRole !== "vendor"),
    staleTime: 30_000,
    retry: false,
  });

  // Calculate live badge counts with strict status === "new" filtering
  const myPendingRequests = (myRequestsData ?? []).filter((r: any) => r.status === "new").length;

  const vendorPendingLeads = (vendorLeadsData?.leads ?? []).filter(
    (l: any) => l.status === "new",
  ).length;

  const wishlistCount = wishlistData?.length ?? 0;

  // Active state detection based on current TanStack Router pathname
  const isHomeActive = pathname === "/";
  const isSearchActive = pathname.startsWith("/search");

  const isRequestsActive =
    (userRole === "vendor" && pathname.startsWith("/vendor/leads")) ||
    (userRole === "admin" && pathname.startsWith("/admin")) ||
    (userRole === "customer" && pathname.startsWith("/dashboard"));

  const isVendorListingsActive =
    userRole === "vendor" && (pathname === "/vendor" || pathname.startsWith("/vendor/listings"));

  const isWishlistActive = pathname.startsWith("/wishlist");

  const isProfileActive =
    (userRole === "vendor" && pathname.startsWith("/vendor/profile")) ||
    (userRole !== "vendor" && pathname.startsWith("/account/profile"));

  // Destination route for Tab 3 depending on user role
  const requestsDestination =
    userRole === "vendor" ? "/vendor/leads" : userRole === "admin" ? "/admin" : "/dashboard";

  // Destination route for Tab 5 depending on user role
  const profileDestination = userRole === "vendor" ? "/vendor/profile" : "/account/profile";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border py-1.5 px-2 md:hidden shadow-lg pb-safe">
      <div className="flex items-center justify-around">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            isHomeActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? "stroke-[2.5] text-accent" : ""}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        {/* 2. Search / Explore */}
        <Link
          to="/search"
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            isSearchActive
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className={`w-5 h-5 ${isSearchActive ? "stroke-[2.5] text-accent" : ""}`} />
          <span className="text-[10px] mt-0.5">Search</span>
        </Link>

        {/* 3. My Bookings / Enquiries / Admin */}
        <Link
          to={requestsDestination}
          className={`relative flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-colors ${
            isRequestsActive
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {userRole === "vendor" ? (
            <CalendarCheck
              className={`w-5 h-5 ${isRequestsActive ? "stroke-[2.5] text-accent" : ""}`}
            />
          ) : userRole === "admin" ? (
            <ShieldCheck
              className={`w-5 h-5 ${isRequestsActive ? "stroke-[2.5] text-rose" : ""}`}
            />
          ) : (
            <CalendarCheck
              className={`w-5 h-5 ${isRequestsActive ? "stroke-[2.5] text-accent" : ""}`}
            />
          )}

          <span className="text-[10px] mt-0.5">
            {userRole === "vendor" ? "Enquiries" : userRole === "admin" ? "Admin" : "Requests"}
          </span>

          {myPendingRequests > 0 && userRole === "customer" && (
            <span className="absolute top-0.5 right-3 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {myPendingRequests}
            </span>
          )}

          {vendorPendingLeads > 0 && userRole === "vendor" && (
            <span className="absolute top-0.5 right-3 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {vendorPendingLeads}
            </span>
          )}
        </Link>

        {/* 4. Tab 4: Listings for Vendor / Wishlist for Customer & Admin */}
        {userRole === "vendor" ? (
          <Link
            to="/vendor"
            className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
              isVendorListingsActive
                ? "text-secondary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Store
              className={`w-5 h-5 ${
                isVendorListingsActive ? "stroke-[2.5] text-accent" : "text-accent"
              }`}
            />
            <span className="text-[10px] mt-0.5">Listings</span>
          </Link>
        ) : (
          <Link
            to="/wishlist"
            className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
              isWishlistActive
                ? "text-rose font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlistActive ? "stroke-[2.5] fill-rose text-rose" : "text-rose"
              }`}
            />
            <span className="text-[10px] mt-0.5">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 bg-rose text-rose-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
        )}

        {/* 5. Profile / Overview */}
        <Link
          to={profileDestination}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            isProfileActive
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className={`w-5 h-5 ${isProfileActive ? "stroke-[2.5] text-accent" : ""}`} />
          <span className="text-[10px] mt-0.5">
            {userRole === "vendor" ? "Overview" : "Profile"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
