import React from "react";
import { BrandName } from "@/components/BrandName";

export interface BrandLogoProps {
  size?: "desktop" | "mobile-menu" | "footer";
  className?: string;
}

export function BrandLogo({
  size = "desktop",
  className = "",
}: BrandLogoProps) {
  if (size === "mobile-menu") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-7 h-7 rounded-lg bg-primary-dark flex items-center justify-center text-primary-foreground font-brand text-sm shadow-xs shrink-0">
          <span className="lowercase text-primary-foreground">c</span>
          <span className="text-accent -ml-0.5 text-xs font-black">&bull;</span>
        </div>
        <span className="font-brand font-black text-lg tracking-tight">celebratz</span>
      </div>
    );
  }

  if (size === "footer") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-primary-dark flex items-center justify-center text-primary-foreground font-brand text-sm shadow-xs border border-primary-dark/20 shrink-0">
          <span className="lowercase text-primary-foreground">c</span>
          <span className="text-accent -ml-0.5 text-[9px] font-black">&bull;</span>
        </div>
        <BrandName size="xl" weight="black" showTagline={false} />
      </div>
    );
  }

  // Desktop Navbar header (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-primary-dark flex items-center justify-center text-primary-foreground font-brand text-lg shadow-xs border border-primary-dark/20 group-hover:scale-105 transition-transform shrink-0">
        <span className="lowercase text-primary-foreground">c</span>
        <span className="text-accent -ml-0.5 text-xs font-black">&bull;</span>
      </div>
      <BrandName
        size="2xl"
        weight="black"
        showTagline={true}
        taglineText="A Celebration Marketplace"
      />
    </div>
  );
}
