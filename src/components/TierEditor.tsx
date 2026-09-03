import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { unitLabel } from "@/lib/pricing";

export type TierDraft = {
  name: string;
  description: string;
  price: string;
  features: string[];
};

export const emptyTier = (): TierDraft => ({ name: "", description: "", price: "", features: [] });

/**
 * Optional "Package Tiers" section for a single listing. Empty = flat pricing.
 * Tiers share the listing's price unit; at least 2 are required when used.
 */
export function TierEditor({
  tiers,
  priceUnit,
  onChange,
}: {
  tiers: TierDraft[];
  priceUnit: string;
  onChange: (tiers: TierDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<TierDraft>) =>
    onChange(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold">Package Tiers (optional)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Offer 2 or more price points for this listing, all {unitLabel(priceUnit)}. Leave empty to keep flat pricing.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => onChange([...tiers, emptyTier()])}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add tier
        </Button>
      </div>

      {tiers.length === 1 && (
        <p className="mt-3 rounded-xl bg-accent/10 p-3 text-sm">
          A single tier is the same as flat pricing — add a second tier or remove this one.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {tiers.map((tier, index) => (
          <div key={index} className="rounded-2xl border border-border/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Tier {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-destructive"
                onClick={() => onChange(tiers.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Tier name</Label>
                <Input
                  value={tier.name}
                  placeholder="Basic / Premium / Deluxe"
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (₹ {unitLabel(priceUnit)})</Label>
                <Input
                  inputMode="numeric"
                  value={tier.price}
                  onChange={(e) => update(index, { price: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3">
              <Label>Short description (optional)</Label>
              <Textarea
                rows={2}
                value={tier.description}
                onChange={(e) => update(index, { description: e.target.value })}
              />
            </div>

            <div className="mt-3">
              <Label>What's included</Label>
              <div className="mt-2 space-y-2">
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <Input
                      value={feature}
                      placeholder="e.g. 8 hours coverage"
                      onChange={(e) =>
                        update(index, {
                          features: tier.features.map((f, i) => (i === featureIndex ? e.target.value : f)),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        update(index, { features: tier.features.filter((_, i) => i !== featureIndex) })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 rounded-xl"
                onClick={() => update(index, { features: [...tier.features, ""] })}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add feature
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function tiersToPayload(tiers: TierDraft[]) {
  return tiers.map((tier) => ({
    name: tier.name.trim(),
    description: tier.description.trim() || undefined,
    price: tier.price,
    features: tier.features.map((f) => f.trim()).filter(Boolean),
  }));
}
