import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Sparkles,
  Building2,
  Camera,
  Utensils,
  Music,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  X,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface HomeHeroProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
  }>;
  eventTypes: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  areas: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// Fixed category-identity icons and content-type styling matching source getCategoryIcon
const getCategoryIcon = (slugOrIcon: string) => {
  switch (slugOrIcon) {
    case "venues":
    case "Building2":
    case "building":
      return <Building2 className="w-6 h-6 text-amber-600" />;
    case "photography":
    case "Camera":
    case "camera":
      return <Camera className="w-6 h-6 text-sky-600" />;
    case "catering":
    case "Utensils":
    case "utensils":
      return <Utensils className="w-6 h-6 text-emerald-600" />;
    case "decoration":
    case "Sparkles":
    case "flower":
      return <Sparkles className="w-6 h-6 text-rose-600" />;
    case "dj-music":
    case "Music":
    case "music":
      return <Music className="w-6 h-6 text-purple-600" />;
    case "pandit":
    case "Flame":
    case "book-open":
      return <Flame className="w-6 h-6 text-orange-600" />;
    default:
      return <Sparkles className="w-6 h-6 text-amber-600" />;
  }
};

const CATEGORY_META: Record<
  string,
  {
    unitLabel: string;
    defaultDescription: string;
  }
> = {
  venues: {
    unitLabel: "per day",
    defaultDescription: "Banquet halls, lawns, resorts & farmhouses",
  },
  photography: {
    unitLabel: "per day",
    defaultDescription: "Candid wedding, pre-wedding & drone coverage",
  },
  catering: {
    unitLabel: "per plate",
    defaultDescription: "Authentic Maharashtrian, North Indian & Grand Buffets",
  },
  decoration: {
    unitLabel: "per event",
    defaultDescription: "Floral mandaps, balloon styling & event themes",
  },
  "dj-music": {
    unitLabel: "per event",
    defaultDescription: "Sound systems, live bands & Bollywood DJs",
  },
  pandit: {
    unitLabel: "per ceremony",
    defaultDescription: "Vedic ceremonies, Vivah, Griha Pravesh & rituals",
  },
};

// All 6 confirmed event types (including Reception) matching source formatEventType
const DEFAULT_EVENT_TYPES = [
  { slug: "wedding", name: "Wedding" },
  { slug: "reception", name: "Reception" },
  { slug: "birthday", name: "Birthday" },
  { slug: "engagement", name: "Engagement" },
  { slug: "naming-ceremony", name: "Naming Ceremony" },
  { slug: "corporate", name: "Corporate Event" },
];

const CITIES = [
  { id: "pune", name: "Pune", state: "Maharashtra", status: "active", badge: "Live Marketplace", hubs: "Baner, Koregaon Park, Kothrud, Wakad, Viman Nagar" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", status: "upcoming", badge: "Coming Soon • Phase 2", hubs: "Bandra, Juhu, Andheri, Powai, South Mumbai" },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", status: "upcoming", badge: "Coming Soon • Phase 2", hubs: "Indiranagar, Koramangala, Whitefield, HSR" },
  { id: "delhi", name: "Delhi NCR", state: "Delhi", status: "upcoming", badge: "Coming Soon • Phase 2", hubs: "Gurugram, South Delhi, Noida, Chattarpur" },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", status: "upcoming", badge: "Coming Soon • Phase 2", hubs: "Gachibowli, Banjara Hills, Jubilee Hills, Hitec City" },
  { id: "goa", name: "Goa", state: "Goa", status: "upcoming", badge: "Coming Soon • Phase 2", hubs: "North Goa Luxury Lawns, South Goa Beach Venues" },
];

export function HomeHero({ categories, eventTypes, areas }: HomeHeroProps) {
  const navigate = useNavigate();

  const [activeCity, setActiveCity] = useState("Pune");
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const [area, setArea] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [guestCount, setGuestCount] = useState<string>("all");

  // Merge loaded event types with defaults to ensure all 6 (including Reception) are always present
  const mergedEventTypes = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    DEFAULT_EVENT_TYPES.forEach((et) => map.set(et.slug, et));
    eventTypes.forEach((et) => map.set(et.slug, et));
    return Array.from(map.values());
  }, [eventTypes]);

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return CITIES;
    const q = citySearchQuery.toLowerCase();
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.hubs.toLowerCase().includes(q)
    );
  }, [citySearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/search",
      search: {
        area: area && area !== "all" ? area : undefined,
        eventType: eventType && eventType !== "all" ? eventType : undefined,
        category: category && category !== "all" ? category : undefined,
        date: date ? format(date, "yyyy-MM-dd") : undefined,
        minCapacity: guestCount && guestCount !== "all" ? Number(guestCount) : undefined,
      },
    });
  };

  return (
    <div className="space-y-12">
      {/* 1. Hero Header Section - 100% fidelity to source layout, gradient, and styling */}
      <section
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-dark via-black to-accent-dark text-white p-6 sm:p-10 lg:p-14 shadow-2xl border border-accent/40"
      >
        {/* Subtle decorative motifs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsCitySelectorOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent-light text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{activeCity}’s Premier Celebration Marketplace</span>
              <span className="px-1.5 py-0.2 rounded bg-accent/30 text-[10px] text-accent-light font-bold">
                Switch City
              </span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold tracking-tight text-accent-light leading-tight">
            Discover &amp; Compare Top Venues &amp; Event Services in {activeCity}
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            {activeCity === "Pune"
              ? "Directly connect with vetted banquet halls, caterers, photographers, decorators, DJs, and Vedic pandits. Check availability, compare transparent pricing, and request walk-throughs in minutes."
              : `Explore upcoming venues, curated decorators, and celebration spaces across ${activeCity}. Currently operating live in Pune with multi-city expansion underway.`}
          </p>

          {/* Prominent Multi-Segment Search Bar - button guaranteed inside form on all screen sizes */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 bg-white/98 dark:bg-card rounded-3xl lg:rounded-full p-3 sm:p-4 lg:p-2 shadow-2xl border border-accent/40 max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center gap-2 text-foreground text-left"
          >
            {/* 1. Location Selector */}
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 lg:border-r border-border">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="w-full min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                  Location ({activeCity})
                </label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="h-7 w-full min-w-0 border-0 bg-transparent p-0 shadow-none text-xs sm:text-sm font-semibold text-foreground focus:ring-0 [&>span]:truncate cursor-pointer">
                    <SelectValue placeholder={`All ${activeCity} Neighborhoods`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {activeCity} Neighborhoods</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.slug} value={a.slug}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Event Type Selector */}
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 lg:border-r border-border">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <div className="w-full min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                  Event Type
                </label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="h-7 w-full min-w-0 border-0 bg-transparent p-0 shadow-none text-xs sm:text-sm font-semibold text-foreground focus:ring-0 [&>span]:truncate cursor-pointer">
                    <SelectValue placeholder="Any Celebration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Celebration</SelectItem>
                    {mergedEventTypes.map((et) => (
                      <SelectItem key={et.slug} value={et.slug}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Service Category Selector */}
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 lg:border-r border-border">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div className="w-full min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                  Service Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-7 w-full min-w-0 border-0 bg-transparent p-0 shadow-none text-xs sm:text-sm font-semibold text-foreground focus:ring-0 [&>span]:truncate cursor-pointer">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Event Date Picker */}
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 lg:border-r border-border">
              <CalendarIcon className="w-4 h-4 text-secondary-dark shrink-0" />
              <div className="w-full min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                  Event Date
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full min-w-0 flex items-center justify-between bg-transparent text-xs sm:text-sm font-semibold text-foreground outline-hidden cursor-pointer text-left h-7",
                        !date && "text-muted-foreground font-normal"
                      )}
                    >
                      <span className="truncate">
                        {date ? format(date, "d MMM yyyy") : "Pick date"}
                      </span>
                      {date ? (
                        <X
                          className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground shrink-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDate(undefined);
                          }}
                        />
                      ) : null}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDay) => {
                        setDate(selectedDay);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 5. Optional Guest Count Filter */}
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                    Guests (Optional)
                  </label>
                  {guestCount && guestCount !== "all" ? (
                    <button
                      type="button"
                      onClick={() => setGuestCount("all")}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <Select value={guestCount} onValueChange={setGuestCount}>
                  <SelectTrigger className="h-7 w-full min-w-0 border-0 bg-transparent p-0 shadow-none text-xs sm:text-sm font-semibold text-foreground focus:ring-0 [&>span]:truncate cursor-pointer">
                    <SelectValue placeholder="Any capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any capacity</SelectItem>
                    <SelectItem value="50">50+ guests</SelectItem>
                    <SelectItem value="100">100+ guests</SelectItem>
                    <SelectItem value="250">250+ guests</SelectItem>
                    <SelectItem value="500">500+ guests</SelectItem>
                    <SelectItem value="1000">1,000+ guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Action Button - 100% matching source classes, color, and behavior */}
            <button
              type="submit"
              className="bg-accent hover:bg-accent-dark text-accent-foreground font-bold px-6 py-3.5 rounded-2xl lg:rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer w-full lg:w-auto"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* City Selector Modal */}
      <Dialog open={isCitySelectorOpen} onOpenChange={setIsCitySelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <Sparkles className="w-5 h-5 text-accent" />
              Select Celebration City
            </DialogTitle>
            <DialogDescription className="text-xs">
              Celebratz is live in Pune and expanding to premier celebration destinations across India.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Indian cities..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-muted/40 outline-hidden focus:border-accent"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredCities.map((c) => {
                const isActive = c.name === activeCity;
                const isLive = c.status === "active";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isLive) {
                        setActiveCity(c.name);
                        setIsCitySelectorOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer",
                      isActive
                        ? "border-accent bg-accent/10 shadow-2xs"
                        : isLive
                        ? "border-border hover:border-accent/60 bg-white dark:bg-card"
                        : "border-border/50 bg-muted/20 opacity-75 cursor-not-allowed"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">({c.state})</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-accent font-bold" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{c.hubs}</p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        isLive
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {c.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. 6 Service Categories Grid - 100% matching source layout, typography, icon boxes, and badges */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              Browse by Celebration Services
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Handcrafted categories curated specifically for Indian family and corporate festivities
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-accent flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug] ?? {
              unitLabel: "per event",
              defaultDescription: "Celebration service in Pune",
            };

            return (
              <Link
                key={cat.slug}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className="group cursor-pointer bg-white dark:bg-card rounded-2xl p-4 border border-border hover:border-accent/80 hover:shadow-lg transition-all text-center flex flex-col items-center justify-between space-y-2 hover:-translate-y-1 select-none"
              >
                <div className="p-3.5 rounded-2xl bg-muted/40 group-hover:bg-accent-subtle transition-colors border border-border-subtle group-hover:border-accent/30">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs sm:text-sm text-foreground group-hover:text-primary">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                    {cat.description || meta.defaultDescription}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-accent-dark bg-accent-subtle/80 px-2 py-0.5 rounded-full border border-accent/40">
                  Starts {meta.unitLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Browse By Event Types - 100% matching source layout, styling, and hover translations */}
      <section className="bg-muted/40 rounded-2xl p-6 border border-border/80 space-y-3">
        <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          What are you celebrating?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {mergedEventTypes.map((type) => (
            <Link
              key={type.slug}
              to="/events/$slug"
              params={{ slug: type.slug }}
              className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-card rounded-xl border border-border hover:border-primary hover:bg-primary-subtle/40 text-foreground hover:text-primary font-semibold text-xs sm:text-sm transition-all shadow-2xs group"
            >
              <span>{type.name}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Why Celebratz - 100% matching source cards, subtle borders, semantic badges, and icons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-primary-subtle text-primary flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <h4 className="font-sans font-bold text-sm text-foreground">Direct Vendor Connection</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No middleman commission markups or hidden fees. Request a visit or enquiry and negotiate contracts directly with the venue management.
          </p>
        </div>

        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-accent-subtle text-accent-dark flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5 text-accent" />
          </div>
          <h4 className="font-sans font-bold text-sm text-foreground">Live Availability &amp; Staleness Radar</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Easily see open, tentative, or booked dates with a clear &quot;Last updated X days ago&quot; timestamp before you reach out.
          </p>
        </div>

        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-secondary-subtle text-secondary-dark flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-secondary-dark" />
          </div>
          <h4 className="font-sans font-bold text-sm text-foreground">Strict Admin Curation</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every vendor profile and banquet space is manually verified in Pune for genuine pricing, capacity, and valid contacts.
          </p>
        </div>
      </section>
    </div>
  );
}
