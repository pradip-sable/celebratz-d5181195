import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  ChevronDown,
  Menu,
  X,
  LogIn,
  LogOut,
  Sparkles,
  Scale,
  Heart,
  Store,
  ShieldCheck,
  User as UserIcon,
  Bell,
  ListOrdered,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandName } from "@/components/BrandName";

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Track Supabase Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close search suggestion popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email ?? "";
  const signedIn = Boolean(session);

  // Query profile from database
  const { data: profile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: Boolean(userId),
  });

  // Query real user role from database
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

  // Query wishlist count if signed in as customer
  const { data: wishlistData } = useQuery({
    queryKey: ["user-wishlist-count", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("customer_id", userId);
      return data ?? [];
    },
    enabled: Boolean(userId && roleData === "customer"),
  });

  const userRole = roleData ?? "customer";
  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    userEmail.split("@")[0] ||
    "My Account";
  const userInitials = (displayName.charAt(0) || "U").toUpperCase();
  const userPhone = profile?.phone || "";
  const wishlistCount = wishlistData?.length ?? 0;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    if (searchQuery.trim()) {
      navigate({
        to: "/search",
        search: { q: searchQuery.trim() },
      });
    } else {
      navigate({ to: "/search" });
    }
  };

  const handleSuggestionClick = (phrase: string) => {
    setSearchQuery(phrase);
    setIsSearchFocused(false);
    navigate({
      to: "/search",
      search: { q: phrase },
    });
  };

  const handleLocalityClick = (locality: string) => {
    setSearchQuery(`${locality} venues`);
    setIsSearchFocused(false);
    navigate({
      to: "/search",
      search: { q: `${locality} venues` },
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & City Selection */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            id="navbar-brand"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-dark flex items-center justify-center text-white font-brand text-lg shadow-xs border border-primary-dark/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="lowercase text-white">c</span>
              <span className="text-accent -ml-0.5 text-xs font-black">&bull;</span>
            </div>
            <BrandName size="2xl" weight="black" showTagline={true} taglineText="A Celebration Marketplace" />
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-border shrink-0" />

          {/* Static City Label next to Brand (Non-interactive) */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-muted/90 text-foreground border border-border/90 text-xs font-semibold shadow-2xs select-none"
            title="Celebratz is live in Pune"
          >
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="font-bold text-xs text-foreground tracking-tight">Pune</span>
            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-success-subtle text-success font-extrabold border border-success/60 hidden xl:inline">
              Live
            </span>
          </div>
        </div>

        {/* Quick Search / Locality pill on Desktop with Autocomplete */}
        <div ref={searchBoxRef} className="relative hidden md:flex items-center flex-1 max-w-lg mx-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center bg-muted/90 rounded-full border border-border/80 px-3.5 py-2 text-sm hover:border-border focus-within:border-primary focus-within:bg-white dark:focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner"
          >
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder='Search "Wedding venue in Baner", catering, DJ...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="bg-transparent border-none outline-hidden text-foreground placeholder:text-muted-foreground text-xs sm:text-sm w-full font-medium"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground p-0.5 ml-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          {/* Search Suggestions Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-2xl shadow-xl border border-border p-3 z-50 space-y-3 animate-in fade-in">
              {/* Popular Example Searches */}
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                  Popular Searches in Pune
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    "Wedding venue in Baner",
                    "Banquet hall in Kothrud",
                    "Wedding photographer in Kalyani Nagar",
                    "Pure veg catering in Hadapsar",
                    "Mandap decoration in Sinhagad Road",
                    "DJ in Baner",
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleSuggestionClick(phrase)}
                      className="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary-subtle hover:text-primary hover:border-primary/40 border border-border text-foreground text-left transition-colors cursor-pointer text-xs"
                    >
                      🔍 {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Locality Pills */}
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                  Filter by Locality in Pune
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    "Baner",
                    "Kothrud",
                    "Kalyani Nagar",
                    "Viman Nagar",
                    "Koregaon Park",
                    "Wakad",
                    "Hadapsar",
                    "Hinjewadi",
                  ].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleLocalityClick(loc)}
                      className="px-2 py-0.5 rounded-md bg-muted hover:bg-accent-subtle text-foreground hover:text-accent-dark border border-border transition-colors cursor-pointer"
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-foreground">
          <Link
            to="/search"
            className={`hover:text-primary transition-colors ${
              pathname === "/search" ? "text-primary font-semibold border-b-2 border-accent pb-0.5" : ""
            }`}
          >
            Explore Vendors
          </Link>

          <Link
            to="/search"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Scale className="w-4 h-4" />
            <span>Compare</span>
          </Link>

          {userRole === "vendor" ? (
            <Link
              to="/vendor"
              className={`flex items-center gap-1.5 hover:text-primary transition-colors ${
                pathname.startsWith("/vendor") ? "text-primary font-bold border-b-2 border-accent pb-0.5" : ""
              }`}
            >
              <Store className="w-4 h-4 text-accent" />
              <span>Listings</span>
            </Link>
          ) : (
            <Link
              to="/wishlist"
              className={`flex items-center gap-1.5 hover:text-primary transition-colors ${
                pathname === "/wishlist" ? "text-primary font-bold" : ""
              }`}
            >
              <Heart className={`w-4 h-4 ${pathname === "/wishlist" ? "fill-destructive text-destructive" : "text-destructive"}`} />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] font-bold bg-destructive text-white rounded-full leading-tight"
                >
                  {wishlistCount}
                </Badge>
              )}
            </Link>
          )}
        </nav>

        {/* Action Controls & Role Portals */}
        <div className="flex items-center gap-2.5">
          {!signedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/for-vendors"
                className="hidden sm:flex items-center gap-1 text-xs text-accent hover:underline font-semibold px-2 py-1"
              >
                <Sparkles className="w-3 h-3 text-accent" />
                <span>List Business</span>
              </Link>
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
                title="Sign in with Google, Mobile or Email"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-border shadow-2xs"
                >
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px] leading-none">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-accent hidden sm:inline">
                    ({userRole})
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 bg-white dark:bg-card rounded-2xl shadow-2xl border border-border py-1.5 z-50 text-foreground text-xs animate-in fade-in"
              >
                {/* User Header */}
                <div className="px-3.5 py-2.5 bg-muted/40 rounded-t-xl mb-1">
                  <p className="font-serif font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                  {userPhone ? (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{userPhone}</p>
                  ) : null}
                </div>

                <DropdownMenuSeparator />

                {/* Role-Specific Navigation Links */}
                {userRole === "vendor" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/vendor"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <Store className="w-3.5 h-3.5 text-accent" />
                        <span>Vendor Studio Overview</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/vendor/leads"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <Bell className="w-3.5 h-3.5 text-primary" />
                        <span>Customer Leads</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/vendor/profile"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Business Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : userRole === "admin" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-destructive" />
                        <span>Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/account/profile"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/account/profile"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <ListOrdered className="w-3.5 h-3.5 text-accent" />
                        <span>My Requests &amp; Bookings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/wishlist"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <Heart className="w-3.5 h-3.5 text-destructive" />
                        <span>Saved Wishlist ({wishlistCount})</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/reviews"
                        className="w-full px-3.5 py-2 flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>My Reviews</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Sign Out Action */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-destructive hover:bg-destructive/10 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Role-Specific Quick Portal Buttons */}
          {signedIn && userRole === "vendor" && (
            <Link
              to="/vendor"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent-dark shadow-xs transition-all"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Studio</span>
            </Link>
          )}

          {signedIn && userRole === "admin" && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive text-white hover:opacity-90 shadow-xs transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          )}

          {/* Mobile Menu Hamburger with shadcn Sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden p-2 text-foreground hover:bg-muted rounded-lg cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-4 space-y-4 overflow-y-auto">
              <SheetHeader className="text-left pb-2">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-dark flex items-center justify-center text-white font-brand text-sm shadow-xs">
                    <span className="lowercase text-white">c</span>
                    <span className="text-accent -ml-0.5 text-xs font-black">&bull;</span>
                  </div>
                  <span className="font-brand font-black text-lg tracking-tight">celebratz</span>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Auth Banner */}
              <div className="p-3.5 bg-primary rounded-2xl text-white flex items-center justify-between shadow-xs">
                {signedIn ? (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-accent text-primary font-bold text-sm font-serif">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-accent truncate">{displayName}</p>
                        <p className="text-[10px] text-primary-foreground/80 capitalize">
                          {userRole} Account
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="px-3 py-1.5 bg-accent hover:opacity-90 text-accent-dark rounded-xl text-xs font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-bold text-accent">Welcome to Celebratz</p>
                      <p className="text-[10px] text-primary-foreground/80">Plan celebrations in Pune</p>
                    </div>
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 bg-accent hover:opacity-90 text-accent-dark rounded-xl text-xs font-bold shadow-xs shrink-0"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Search Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  if (searchQuery.trim()) {
                    navigate({ to: "/search", search: { q: searchQuery.trim() } });
                  } else {
                    navigate({ to: "/search" });
                  }
                }}
                className="flex items-center bg-muted rounded-xl p-2.5 border border-border"
              >
                <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Pune venues or services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm w-full outline-hidden text-foreground placeholder:text-muted-foreground font-medium"
                />
              </form>

              {/* Mobile Quick Grid Links */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground transition-colors"
                >
                  🏠 Home
                </Link>
                <Link
                  to="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground transition-colors"
                >
                  🔍 Browse Listings
                </Link>
                <Link
                  to="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                >
                  <span>⚖️ Compare</span>
                </Link>

                {signedIn && userRole === "vendor" ? (
                  <>
                    <Link
                      to="/vendor"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>🏪 My Listings</span>
                    </Link>
                    <Link
                      to="/vendor/leads"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>📥 Customer Leads</span>
                    </Link>
                  </>
                ) : signedIn && userRole === "admin" ? (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>🛡️ Admin Panel</span>
                    </Link>
                    <Link
                      to="/account/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>👤 My Profile</span>
                    </Link>
                  </>
                ) : signedIn ? (
                  <>
                    <Link
                      to="/account/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>👤 My Profile</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>❤️ Saved Wishlist</span>
                      {wishlistCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-destructive text-white rounded-full px-1.5 py-0 text-[10px]"
                        >
                          {wishlistCount}
                        </Badge>
                      )}
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-3 rounded-xl text-left bg-muted/50 hover:bg-muted text-foreground col-span-2 transition-colors"
                    >
                      📋 Bookings &amp; Enquiries
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/for-vendors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-xl text-left bg-accent-subtle hover:bg-accent-subtle/80 text-accent-dark font-bold border border-accent/40 col-span-2 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>List Your Business — Free</span>
                  </Link>
                )}
              </div>

              {/* Mobile Drawer Footer Links */}
              <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  About Celebratz
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  Support
                </Link>
                <Link
                  to="/for-vendors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  For Vendors
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
