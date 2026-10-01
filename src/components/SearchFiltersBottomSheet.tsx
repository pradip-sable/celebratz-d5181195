import React, { useState, useEffect, useMemo } from "react";
import { X, SlidersHorizontal, RotateCcw, MapPin, Users } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { formatInr } from "@/lib/pricing";
import { Checkbox } from "@/components/ui/checkbox";

export interface SearchFiltersBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  eventTypes: Array<{ id: string; name: string; slug: string }>;
  areas: Array<{ id: string; name: string; slug: string }>;
  totalResults?: number;
}

// Canonical event types including Reception (matches HomeHero)
const DEFAULT_EVENT_TYPES = [
  { slug: "wedding", name: "Wedding" },
  { slug: "reception", name: "Reception" },
  { slug: "birthday", name: "Birthday" },
  { slug: "engagement", name: "Engagement" },
  { slug: "naming-ceremony", name: "Naming Ceremony" },
  { slug: "corporate", name: "Corporate Event" },
];

export const SearchFiltersBottomSheet: React.FC<SearchFiltersBottomSheetProps> = ({
  isOpen,
  onClose,
  categories,
  eventTypes,
  areas,
  totalResults = 0,
}) => {
  const search = useSearch({ from: "/search" });
  const navigate = useNavigate();

  // Local draft state for filters
  const [area, setArea] = useState<string>(search.area ?? "all");
  const [eventType, setEventType] = useState<string>(search.eventType ?? "all");
  const [category, setCategory] = useState<string>(search.category ?? "all");
  const [date, setDate] = useState<string>(search.date ?? "");
  const [guestCount, setGuestCount] = useState<number>(
    search.minCapacity ? Number(search.minCapacity) : 0,
  );
  const [budgetMax, setBudgetMax] = useState<number>(
    search.maxPrice ? Number(search.maxPrice) : 500000,
  );
  const [pureVegOnly, setPureVegOnly] = useState<boolean>(false);
  const [hasACOnly, setHasACOnly] = useState<boolean>(false);

  // Sync draft state with URL search params whenever sheet opens or search changes
  useEffect(() => {
    if (isOpen) {
      setArea(search.area ?? "all");
      setEventType(search.eventType ?? "all");
      setCategory(search.category ?? "all");
      setDate(search.date ?? "");
      setGuestCount(search.minCapacity ? Number(search.minCapacity) : 0);
      setBudgetMax(search.maxPrice ? Number(search.maxPrice) : 500000);
    }
  }, [isOpen, search.area, search.eventType, search.category, search.date, search.minCapacity, search.maxPrice]);

  useModalScrollLock(isOpen, onClose);

  // Merge loaded event types with canonical defaults to guarantee all 6 (including Reception)
  const mergedEventTypes = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    DEFAULT_EVENT_TYPES.forEach((et) => map.set(et.slug, et));
    eventTypes.forEach((et) => map.set(et.slug, et));
    return Array.from(map.values());
  }, [eventTypes]);

  if (!isOpen) return null;

  const handleReset = () => {
    setArea("all");
    setEventType("all");
    setCategory("all");
    setDate("");
    setGuestCount(0);
    setBudgetMax(500000);
    setPureVegOnly(false);
    setHasACOnly(false);

    navigate({
      to: "/search",
      search: search.q ? { q: search.q } : {},
    });
  };

  const handleApply = () => {
    navigate({
      to: "/search",
      search: {
        q: search.q || undefined,
        area: area !== "all" ? area : undefined,
        eventType: eventType !== "all" ? eventType : undefined,
        category: category !== "all" ? category : undefined,
        date: date || undefined,
        minCapacity: guestCount > 0 ? guestCount : undefined,
        maxCapacity: undefined, // left unset per rule 1
        maxPrice: budgetMax < 500000 ? budgetMax : undefined, // per rule 2
        minPrice: undefined, // left unset per rule 2
      },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-sheet-title"
    >
      {/* Backdrop overlay dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-card rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom-8 z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 id="filters-sheet-title" className="font-serif font-bold text-base text-foreground">
              Filters &amp; Preferences
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* City Selection Bar - Static Pune label per guardrail (no city switcher) */}
          <div className="p-3 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <div>
                <span className="text-xs font-bold text-foreground">Pune</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">(Maharashtra)</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Pune Marketplace
            </span>
          </div>

          {/* 1. Locality / Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Pune Locality / Area
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs sm:text-sm text-foreground font-medium focus:border-primary outline-hidden cursor-pointer"
            >
              <option value="all">All Pune Neighborhoods</option>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Event Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Event Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setEventType("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  eventType === "all"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted hover:bg-muted text-foreground"
                }`}
              >
                All Events
              </button>
              {mergedEventTypes.map((et) => (
                <button
                  key={et.slug}
                  type="button"
                  onClick={() => setEventType(et.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    eventType === et.slug
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted hover:bg-muted text-foreground"
                  }`}
                >
                  {et.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Service Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Service Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                  category === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted text-foreground"
                }`}
              >
                ✨ All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    category === c.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted text-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Event Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Event Date (Check Availability)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs sm:text-sm text-foreground font-medium focus:border-primary outline-hidden"
            />
          </div>

          {/* 5. Guest Count (Optional) - Maps strictly to minCapacity only */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Guest Count / Expected Pax
                </label>
              </div>
              {guestCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setGuestCount(0)}
                  className="text-xs text-secondary hover:underline font-bold cursor-pointer"
                >
                  Clear ({guestCount})
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground font-medium">Optional</span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-tight">
              Filters <strong className="text-foreground">Venues</strong> with adequate hall/lawn capacity and{" "}
              <strong className="text-foreground">Catering</strong> packages matching your minimum guest scale.
            </p>

            {/* Quick Guest Count Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Any Pax", val: 0 },
                { label: "50+", val: 50 },
                { label: "100+", val: 100 },
                { label: "250+", val: 250 },
                { label: "500+", val: 500 },
                { label: "1,000+", val: 1000 },
                { label: "1,500+", val: 1500 },
              ].map((preset) => {
                const isSelected = guestCount === preset.val;
                return (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setGuestCount(preset.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card hover:bg-muted border border-border text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                Custom Count:
              </span>
              <input
                type="number"
                min="0"
                step="25"
                placeholder="e.g. 350"
                value={guestCount > 0 ? guestCount : ""}
                onChange={(e) =>
                  setGuestCount(e.target.value ? Math.max(0, Number(e.target.value)) : 0)
                }
                className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* 6. Budget Cap Slider - Maps strictly to maxPrice only */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Max Budget Cap
              </label>
              <span className="text-xs font-bold text-primary">
                {budgetMax >= 500000 ? "Any Budget" : formatInr(budgetMax)}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="500000"
              step="5000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>₹5k</span>
              <span>₹1 Lakh</span>
              <span>₹3 Lakhs</span>
              <span>₹5 Lakhs+</span>
            </div>
          </div>

          {/* 7. Venue & Catering Specific Toggles - Using shadcn Checkbox primitive */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Specialized Preferences
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-muted/40 rounded-xl border border-border cursor-pointer">
              <Checkbox
                checked={pureVegOnly}
                onCheckedChange={(c) => setPureVegOnly(c === true)}
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Pure Veg Only (Catering)</span>
                <p className="text-[10px] text-muted-foreground">
                  Filters catering to 100% vegetarian &amp; Jain kitchen facilities
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-muted/40 rounded-xl border border-border cursor-pointer">
              <Checkbox
                checked={hasACOnly}
                onCheckedChange={(c) => setHasACOnly(c === true)}
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  Air Conditioned Halls Only (Venues)
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Requires central air conditioning in banquet spaces
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between rounded-b-3xl sm:rounded-b-2xl">
          <p className="text-xs text-muted-foreground">
            Matching <span className="font-bold text-foreground">{totalResults}</span> listings in Pune
          </p>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};
