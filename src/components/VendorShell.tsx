import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { getVendorDashboard } from "@/lib/dashboard.functions";
import { getMyPackages } from "@/lib/packages.functions";

interface VendorShellProps {
  children: React.ReactNode;
}

export function VendorShell({ children }: VendorShellProps) {
  const { pathname } = useLocation();

  const fetchDashboard = useServerFn(getVendorDashboard);
  const fetchPackages = useServerFn(getMyPackages);

  const { data: dashboardData } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const { data: packagesData } = useQuery({
    queryKey: ["vendor-packages"],
    queryFn: () => fetchPackages(),
  });

  const vendor = dashboardData?.vendor ?? packagesData?.vendor;
  const listings = dashboardData?.listings ?? [];
  const leads = dashboardData?.leads ?? [];
  const packages = packagesData?.packages ?? [];

  const totalLeadsCount = leads.length;
  const pendingLeadsCount = leads.filter((l: any) => l.status === "new").length;
  const listingsCount = listings.length;
  const packagesCount = packages.length;
  const firstListingId = listings[0]?.id;

  const isOverviewActive = pathname === "/vendor" || pathname === "/vendor/";
  const isLeadsActive = pathname === "/vendor/leads" || pathname.startsWith("/vendor/leads/");
  const isCalendarActive = pathname.startsWith("/vendor/calendar");
  const isListingsActive =
    pathname === "/vendor/listings" ||
    pathname === "/vendor/listings/" ||
    (pathname.startsWith("/vendor/listings/") && pathname !== "/vendor/listings/new");
  const isPackagesActive =
    pathname.startsWith("/vendor/packages") && pathname !== "/vendor/packages/new";
  const isCreateListingActive = pathname === "/vendor/listings/new";

  const businessName = vendor?.business_name || "Vendor Management Studio";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12 space-y-6">
      {/* Vendor Top Banner */}
      <div className="bg-primary-dark text-primary-foreground rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
              Vendor Management Studio
            </span>
            <span className="text-xs text-primary-foreground/70">&bull; Pune Partner Hub</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-primary-foreground">
            {businessName}
          </h1>
          <p className="text-xs sm:text-sm text-primary-foreground/80 font-light mt-1">
            Manage your availability calendar, incoming client leads, and Pune listing profiles.
          </p>
          <div className="mt-2">
            <Link
              to="/vendor/profile"
              className="inline-flex items-center gap-1 text-xs text-accent-light hover:underline font-semibold"
            >
              <span>Business profile</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to="/vendor/listings/new"
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-transform active:scale-95 shadow-md shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Listing</span>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted rounded-2xl text-xs font-semibold">
        <Link
          to="/vendor"
          className={`px-4 py-2.5 rounded-xl transition-all ${
            isOverviewActive
              ? "bg-card text-primary-dark shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📊 Overview
        </Link>

        <Link
          to="/vendor/leads"
          className={`px-4 py-2.5 rounded-xl transition-all relative flex items-center gap-1.5 ${
            isLeadsActive
              ? "bg-card text-primary-dark shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>📥 Leads & Enquiries ({totalLeadsCount})</span>
          {pendingLeadsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded-full text-[10px] font-bold">
              {pendingLeadsCount} New
            </span>
          )}
        </Link>

        {firstListingId ? (
          <Link
            to="/vendor/calendar/$listingId"
            params={{ listingId: firstListingId }}
            className={`px-4 py-2.5 rounded-xl transition-all ${
              isCalendarActive
                ? "bg-card text-primary-dark shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 Availability Calendar
          </Link>
        ) : (
          <span
            title="Create a listing first to manage availability"
            className="px-4 py-2.5 rounded-xl text-muted-foreground/60 opacity-60 cursor-not-allowed select-none"
          >
            📅 Availability Calendar
          </span>
        )}

        <Link
          to="/vendor/listings"
          className={`px-4 py-2.5 rounded-xl transition-all ${
            isListingsActive
              ? "bg-card text-primary-dark shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🏢 My Listings ({listingsCount})
        </Link>

        <Link
          to="/vendor/packages"
          className={`px-4 py-2.5 rounded-xl transition-all ${
            isPackagesActive
              ? "bg-card text-primary-dark shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎁 Packages & Bundles ({packagesCount})
        </Link>

        <Link
          to="/vendor/listings/new"
          className={`px-4 py-2.5 rounded-xl transition-all ${
            isCreateListingActive
              ? "bg-card text-primary-dark shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          + Create Listing
        </Link>
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
