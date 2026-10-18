import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

interface AreaItem {
  id: string;
  name: string;
  slug: string;
}

interface PopularLocalitiesProps {
  areas: AreaItem[];
}

export function PopularLocalities({ areas }: PopularLocalitiesProps) {
  return (
    <section className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-serif font-bold text-xl text-foreground">
          Explore by Pune Locality
        </h3>
      </div>
      <p className="text-xs text-muted-foreground max-w-xl">
        Browse celebration venues, banquet lawns, and verified service experts close to your event location in Pune.
      </p>

      <div className="flex flex-wrap gap-2 pt-2">
        {areas.map((loc) => (
          <Link
            key={loc.id}
            to="/search"
            search={{ area: loc.slug }}
            className="px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-primary-subtle hover:text-primary border border-border text-xs font-semibold text-foreground transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1"
          >
            <span>📍</span>
            <span>{loc.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
