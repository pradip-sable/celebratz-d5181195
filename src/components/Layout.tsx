import { useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ComparisonBar } from "@/components/ComparisonBar";
import { SiteFooter } from "@/components/SiteFooter";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/auth") || pathname.startsWith("/request");
  const isComparePage = pathname === "/compare";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />

      <main className="flex-1">{children}</main>

      <SiteFooter />

      {!hideNav && !isComparePage && <ComparisonBar />}
      {!hideNav && <MobileBottomNav />}
    </div>
  );
}
