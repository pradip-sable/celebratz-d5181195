export function HowItWorks() {
  return (
    <section className="bg-primary-dark text-primary-foreground rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">
          Direct &amp; Transparent
        </span>
        <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-accent-subtle">
          How Celebratz Works for Pune Planners
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-light">
          No hidden middleman markups. Discover spaces, check live dates, and meet directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-foreground/80 p-6 rounded-2xl border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent text-foreground font-serif font-extrabold text-lg flex items-center justify-center">
            1
          </div>
          <h3 className="font-serif font-bold text-lg text-primary-foreground">Search &amp; Filter</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-light">
            Filter by 6 core categories (Venues, Catering, Decor, Photo, DJ, Pandit), budget ranges, and Pune areas like Baner, Koregaon Park, Kothrud, or Hadapsar.
          </p>
        </div>

        <div className="bg-foreground/80 p-6 rounded-2xl border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-serif font-extrabold text-lg flex items-center justify-center">
            2
          </div>
          <h3 className="font-serif font-bold text-lg text-primary-foreground">Check Calendar &amp; Compare</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-light">
            View color-coded vendor calendars (Green: Available, Amber: Tentative, Red: Booked) with live staleness indicators, and compare up to 3 listings side-by-side.
          </p>
        </div>

        <div className="bg-foreground/80 p-6 rounded-2xl border border-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-destructive text-destructive-foreground font-serif font-extrabold text-lg flex items-center justify-center">
            3
          </div>
          <h3 className="font-serif font-bold text-lg text-primary-foreground">Request to Book / Visit</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-light">
            Submit a walkthrough request with double-entry phone verification. The vendor contacts you directly to negotiate, tour, and finalize your celebration contract!
          </p>
        </div>
      </div>
    </section>
  );
}
