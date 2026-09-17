import { Link, useLocation } from "@tanstack/react-router";
import { Search, Heart, CalendarDays, User, Home } from "lucide-react";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/auth") || pathname.startsWith("/request");

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 bg-muted/30 py-8 text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <span className="font-brand text-lg font-bold text-foreground">Celebratz</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link to="/for-vendors" className="hover:text-foreground">
                List your business
              </Link>

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
            <MobileNavItem to="/dashboard" icon={CalendarDays} label="Bookings" />
            <MobileNavItem to="/wishlist" icon={Heart} label="Wishlist" />
            <MobileNavItem to="/account/profile" icon={User} label="Profile" />
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
