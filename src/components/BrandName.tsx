import React from "react";

export interface BrandNameProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "inherit";
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold" | "black";
  showTagline?: boolean;
  taglineText?: string;
  taglineColor?: string;
  badge?: string;
}

export const BrandName: React.FC<BrandNameProps> = ({
  className = "",
  size = "2xl",
  weight = "black",
  showTagline = true,
  taglineText = "A Celebration Marketplace",
  taglineColor,
  badge,
}) => {
  // Sizing definitions ensuring combined height (brand name + tagline) fits comfortably within icon height
  // Tagline is right-aligned to end precisely with character 'z'.
  const sizeConfigs: Record<
    string,
    {
      brandSize: string;
      taglineSize: string;
      gap: string;
      letterSpacing: string;
      taglineTracking: string;
    }
  > = {
    xs: {
      brandSize: "10px",
      taglineSize: "3.8px",
      gap: "0px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    sm: {
      brandSize: "12px",
      taglineSize: "4.5px",
      gap: "0px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    base: {
      brandSize: "14px",
      taglineSize: "5.2px",
      gap: "0.5px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    lg: {
      brandSize: "16px",
      taglineSize: "6px",
      gap: "0.5px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    xl: {
      brandSize: "18px",
      taglineSize: "6.8px",
      gap: "0.75px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    "2xl": {
      brandSize: "20px",
      taglineSize: "7.5px",
      gap: "1px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    "3xl": {
      brandSize: "24px",
      taglineSize: "9px",
      gap: "1.5px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
    inherit: {
      brandSize: "20px",
      taglineSize: "7.5px",
      gap: "1px",
      letterSpacing: "-0.025em",
      taglineTracking: "-0.01em",
    },
  };

  const weightValues: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };

  const defaultConfig = {
    brandSize: "20px",
    taglineSize: "7.5px",
    gap: "1px",
    letterSpacing: "-0.025em",
    taglineTracking: "-0.01em",
  };

  const currentConfig = sizeConfigs[size] ?? defaultConfig;
  const fontWeightNum = weightValues[weight] ?? 900;

  return (
    <div className={`inline-flex flex-col justify-center select-none ${className}`}>
      {/* Top Row: Brand Name "celebratz" */}
      <div
        className="inline-flex items-baseline lowercase tracking-tight leading-none font-brand"
        style={{
          fontFamily: "'Agrandir Grand', 'Agrandir', sans-serif",
          fontSize: currentConfig.brandSize,
          fontWeight: fontWeightNum,
          lineHeight: 1,
          letterSpacing: currentConfig.letterSpacing,
        }}
      >
        <span className="text-foreground">celebrat</span>
        <span className="text-accent">z</span>

        {badge && (
          <span
            className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-accent-light text-accent-dark border border-accent align-middle"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Bottom Row: Tagline text right-aligned with brand name to end with character 'z' */}
      {showTagline && (
        <div
          className="w-full flex justify-end items-center leading-none"
          style={{ marginTop: currentConfig.gap }}
        >
          <span
            className="text-right whitespace-nowrap leading-none block select-none text-foreground"
            style={{
              fontFamily: "'Agrandir', 'Agrandir Grand', sans-serif",
              color: taglineColor,
              fontWeight: 400,
              fontSize: currentConfig.taglineSize,
              lineHeight: 1,
              letterSpacing: currentConfig.taglineTracking,
            }}
          >
            {taglineText}
          </span>
        </div>
      )}
    </div>
  );
};
