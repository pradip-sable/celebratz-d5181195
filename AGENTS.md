<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
## Project Context for Coding Agents

Celebratz is a discovery/lead-gen marketplace for celebration venues & services
(Pune-first, India). Users search and enquire; vendors follow up off-platform.
No in-app payments in Phase 1.

### Stack
React + TypeScript + Tailwind CSS v4 + shadcn/ui (Radix primitives) +
TanStack Router/Query + Supabase (via Lovable Cloud).

### Scope boundary — READ BEFORE EDITING
This repo is worked on by two separate tracks that must not overlap in the same
session:
- **UI work (this agent's job)**: components, routes, hooks, client-side
  presentation logic. Safe to edit freely.
- **Backend work (Lovable's job only)**: `supabase/migrations/`, RLS policies,
  edge functions, auth/OTP config, anything under `src/lib/*.functions.ts`
  that touches schema shape. DO NOT modify these unless explicitly instructed
  in the task — even if a UI change seems to require a backend tweak, flag it
  instead of making it, so it can be routed through Lovable.

### Backend conventions already in place (read, don't reinvent)
- Server functions live in `src/lib/*.functions.ts`: `listings.functions.ts`,
  `packages.functions.ts`, `requests.functions.ts`, `vendor.functions.ts`,
  `dashboard.functions.ts`, `admin.functions.ts`, `pricing.ts`.
- Package/listing prices are NEVER stored statically — always computed at read
  time via `computePackagePrice()` / `effectiveListingPrice()` in `pricing.ts`.
  Reuse these functions; don't recompute pricing logic inline in components.
- `requests` table fields: `kind` ('booking_request'|'enquiry'), exactly one
  of `listingId`/`packageId`, `selectedTierId` (only valid with `listingId`),
  `customerPhoneConfirm` required alongside `customerPhone`.

### Design system — use existing tokens, don't hardcode
Colors are semantic CSS variables in the global stylesheet (`bg-primary`,
`bg-teal`, `bg-gold`, `bg-blush`, `bg-cream`, `bg-rose`, etc.). Never introduce
raw Tailwind palette classes (`bg-teal-950`, `bg-rose-900`) for brand/theme
styling. Exception: fixed category-identity colors (photography=sky,
DJ/Music=purple, catering=emerald, decoration=rose, pandit/priest=orange) stay
as literal classes — they represent content type, not brand theme.

### Sync rule
Never edit a file here in Lovable's web editor and via this agent in the same
work session — pick one direction per session to avoid merge conflicts. Push
only to `main` (Lovable only syncs from `main`).

### Reference doc
See `celebratz-lovable-port-checklist.md` (if present in repo root, or ask
Pradip) for known gaps between the AI Studio prototype and this codebase's
actual schema before porting any package/tier/pricing-related screen.
