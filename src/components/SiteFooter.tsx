import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";

const CELEBRATION_SERVICES = [
  { name: "Venues", slug: "venues" },
  { name: "Photography & Videography", slug: "photography" },
  { name: "Catering", slug: "catering" },
  { name: "Decoration", slug: "decoration" },
  { name: "DJ / Music / Live Band", slug: "dj-music" },
  { name: "Pandit / Priest", slug: "pandit" },
];

const POPULAR_HUBS = [
  { name: "Baner", slug: "baner" },
  { name: "Koregaon Park", slug: "koregaon-park" },
  { name: "Kothrud", slug: "kothrud" },
  { name: "Wakad", slug: "wakad" },
  { name: "Viman Nagar", slug: "viman-nagar" },
  { name: "Hinjewadi", slug: "hinjewadi" },
];

export function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-muted-foreground pt-12 pb-24 md:pb-12 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/"
                className="px-2.5 py-1.5 rounded-xl bg-card flex items-center gap-2 shadow-xs border border-border group hover:border-border/80 transition-colors"
              >
                <BrandLogo size="footer" className="gap-2" />
              </Link>
              <div
                className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-accent text-foreground flex items-center gap-1 select-none"
                title="Celebratz is live in Pune"
              >
                <span>Pune</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Discover and compare venues, catering, decoration, photography, DJs, and Vedic pandits for weddings, birthdays, and celebrations across Pune, Maharashtra.
            </p>
            <div className="text-[11px] text-muted-foreground pt-1">
              Support:{" "}
              <a href="mailto:celebratzapp@gmail.com" className="text-accent hover:underline">
                celebratzapp@gmail.com
              </a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-sm text-muted-foreground">Celebration Services</h4>
            <ul className="space-y-1.5 text-xs">
              {CELEBRATION_SERVICES.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="hover:text-accent transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Localities */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-sm text-muted-foreground">
              Popular Pune Hubs
            </h4>
            <ul className="space-y-1.5 text-xs">
              {POPULAR_HUBS.map((hub) => (
                <li key={hub.slug}>
                  <Link
                    to="/search"
                    search={{ category: "venues", area: hub.slug }}
                    className="hover:text-accent transition-colors"
                  >
                    Venues in {hub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Trust & Legal */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-sm text-muted-foreground">Trust &amp; Legal</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  About Celebratz
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy (Data Consent)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Terms of Service (Offline Booking)
                </Link>
              </li>
              <li>
                <Link to="/for-vendors" className="hover:text-accent transition-colors">
                  List your business
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Celebratz India. Crafted for Pune Celebrations.</p>
          <p className="text-[11px] text-muted-foreground">
            Celebratz is a discovery platform. Contracts and payments occur directly with vendors.
          </p>
        </div>
      </div>
    </footer>
  );
}
