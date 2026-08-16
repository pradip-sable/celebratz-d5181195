import { Link, useLocation } from "@tanstack/react-router";
import { Search, Heart, CalendarDays, User, Home } from "lucide-react";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/auth") || pathname.startsWith("/request");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-primary">Celebratz</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link to="/search" className="hover:text-primary">Search</Link>
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
            <Link to="/auth" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:bg-primary/90">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 bg-muted/30 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <span className="font-serif text-lg font-semibold text-foreground">Celebratz</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="hover:text-foreground">About</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
            </div>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} Celebratz. Celebrations made simple in Pune.</p>
        </div>
      </footer>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background pb-safe md:hidden">
          <div className="mx-auto flex max-w-md justify-around py-2">
            <MobileNavItem to="/" icon={Home} label="Home" />
            <MobileNavItem to="/search" icon={Search} label="Search" />
            <MobileNavItem to="/dashboard/bookings" icon={CalendarDays} label="Bookings" />
            <MobileNavItem to="/dashboard/wishlist" icon={Heart} label="Wishlist" />
            <MobileNavItem to="/dashboard/profile" icon={User} label="Profile" />
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileNavItem({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
