import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ComparisonBar } from "@/components/ComparisonBar";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/auth") || pathname.startsWith("/request");
  const isComparePage = pathname === "/compare";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 bg-muted/30 py-8 text-sm text-muted-foreground pb-24 md:pb-8">
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
          <p className="mt-4">
            © {new Date().getFullYear()} Celebratz. Celebrations made simple in Pune.
          </p>
        </div>
      </footer>

      {!hideNav && !isComparePage && <ComparisonBar />}
      {!hideNav && <MobileBottomNav />}
    </div>
  );
}
