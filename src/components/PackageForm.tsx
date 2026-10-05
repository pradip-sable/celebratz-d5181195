import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  Building,
  IndianRupee,
  Percent,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  computePackagePrice,
  effectiveListingPrice,
  formatInr,
  type DiscountType,
  type TierLike,
} from "@/lib/pricing";
import { SubmissionConfirmationModal } from "@/components/SubmissionConfirmationModal";

export type LiveListingItem = {
  id: string;
  title: string;
  price_from: number | null;
  price_unit?: string | null;
  status?: string;
  categories?: { name: string } | null;
  listing_tiers?: TierLike[] | null;
};

export interface PackageFormProps {
  liveListings: LiveListingItem[];
  initialValues?: {
    name?: string;
    description?: string;
    cover_image?: string;
    discount_type?: DiscountType;
    discount_value?: number;
    listing_ids?: string[];
  };
  isEdit?: boolean;
  currentStatus?: string;
  rejectionReason?: string | null | undefined;
  isSubmitting?: boolean;
  onSubmit: (data: {
    name: string;
    description: string;
    cover_image: string;
    discount_type: DiscountType;
    discount_value: number;
    listing_ids: string[];
  }) => Promise<void> | void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  liveListings,
  initialValues,
  isEdit = false,
  currentStatus,
  rejectionReason,
  isSubmitting = false,
  onSubmit,
}) => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [coverImage, setCoverImage] = useState(initialValues?.cover_image ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialValues?.discount_type ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState<number | string>(
    initialValues?.discount_value ?? 15,
  );
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>(
    initialValues?.listing_ids ??
      (liveListings.length >= 2 && liveListings[0] && liveListings[1]
        ? [liveListings[0].id, liveListings[1].id]
        : []),
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Selected component objects
  const selectedComponents = useMemo(() => {
    return liveListings.filter((l) => selectedListingIds.includes(l.id));
  }, [liveListings, selectedListingIds]);

  // Live computed price
  const price = useMemo(() => {
    return computePackagePrice(selectedComponents, discountType, discountValue);
  }, [selectedComponents, discountType, discountValue]);

  const handleToggleListing = (id: string) => {
    setSelectedListingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const validate = (): boolean => {
    setErrorMessage(null);

    if (name.trim().length < 3) {
      setErrorMessage("Package name must be at least 3 characters.");
      return false;
    }
    if (name.trim().length > 160) {
      setErrorMessage("Package name must not exceed 160 characters.");
      return false;
    }
    if (selectedListingIds.length < 2) {
      setErrorMessage("Please select at least 2 live services to bundle into this package.");
      return false;
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage("Please provide a valid discount value greater than 0.");
      return false;
    }

    if (discountType === "percentage") {
      if (numValue > 90) {
        setErrorMessage("Percentage discount cannot exceed 90%.");
        return false;
      }
    } else {
      if (numValue >= price.base) {
        setErrorMessage(
          `Fixed discount of ${formatInr(numValue)} cannot exceed or equal the combined value of ${formatInr(
            price.base,
          )}. Keep the discount below that so the package has a price.`,
        );
        return false;
      }
    }

    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsConfirmationOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      cover_image: coverImage.trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      listing_ids: selectedListingIds,
    });
    setIsConfirmationOpen(false);
  };

  const savingsPercentage =
    price.base > 0 ? Math.round((price.discount / price.base) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/vendor/packages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Packages</span>
        </Link>

        {isEdit && currentStatus && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Status: {currentStatus}
          </span>
        )}
      </div>

      {/* Rejection notice if previously rejected */}
      {isEdit && currentStatus === "rejected" && rejectionReason && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Previous Rejection Reason:
          </p>
          <p className="mt-1">{rejectionReason}</p>
        </div>
      )}

      {/* Edit review reminder banner */}
      {isEdit && currentStatus === "live" && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-xs text-accent-foreground flex items-start gap-3">
          <Lock className="h-4 w-4 shrink-0 text-accent mt-0.5" />
          <div>
            <span className="font-bold block">Review Policy Note</span>
            <p className="mt-0.5 text-muted-foreground">
              Any updates to an active live package will return it to moderation review (&apos;pending&apos;)
              before republishing.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form
        onSubmit={handleFormSubmit}
        className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-primary-dark via-primary to-accent-dark p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Multi-Service Package Builder
              </span>
              <h1 className="font-serif text-xl font-bold text-white sm:text-2xl">
                {isEdit ? "Edit Combo Package" : "Create New Multi-Service Package"}
              </h1>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/80 max-w-2xl">
            Bundle two or more of your active celebration services into a single, cohesive package.
            Pune event hosts love one-stop solutions with guaranteed bundled savings.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Package Title & Description */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="pkg-name" className="text-xs font-bold uppercase tracking-wider">
                Package Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pkg-name"
                required
                minLength={3}
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Vivah Grand Combo: Banquet Hall + Mandap Decor + Catering"
                className="mt-1.5 rounded-xl border-border text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Highlight the bundled services in the title so customers immediately know what is included.
              </p>
            </div>

            <div>
              <Label htmlFor="pkg-description" className="text-xs font-bold uppercase tracking-wider">
                Package Description &amp; Value Proposition
              </Label>
              <Textarea
                id="pkg-description"
                rows={3}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why choosing this combined package gives the customer peace of mind, premium quality, and massive savings..."
                className="mt-1.5 rounded-xl border-border text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Describe the seamless coordination, included deliverables, and special perks.
              </p>
            </div>
          </div>

          {/* Section 2: Component Listings Selector */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-base font-bold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Select Services to Combine (Min. 2 Services)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select 2 or more of your active live listings to bundle together.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                {selectedListingIds.length} Selected
              </span>
            </div>

            {liveListings.length < 2 ? (
              <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-xs text-accent-foreground space-y-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  Minimum 2 Live Listings Required
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You currently have {liveListings.length} live listing{liveListings.length === 1 ? "" : "s"}.
                  A package requires at least 2 approved and active listings to bundle. Please create and publish
                  more listings first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {liveListings.map((item) => {
                  const isChecked = selectedListingIds.includes(item.id);
                  const effectivePrice = effectiveListingPrice(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleListing(item.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between select-none ${
                        isChecked
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div click
                          className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block truncate">
                            {item.categories?.name ?? "Service"}
                          </span>
                          <h4 className="font-bold text-xs text-foreground line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-[11px] text-muted-foreground font-medium">
                            Standard: {effectivePrice != null ? formatInr(effectivePrice) : "Price on request"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Smart Pricing & Discount Engine */}
          <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 via-primary/5 to-muted/40 p-5 space-y-4">
            <h3 className="font-serif text-base font-bold flex items-center gap-2 text-foreground">
              <IndianRupee className="h-4 w-4 text-primary" />
              Smart Package Pricing &amp; Discount Engine
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Box 1: Combined Standard Total */}
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Combined Standard Value
                </span>
                <div className="font-serif text-lg sm:text-xl font-bold text-muted-foreground line-through">
                  {formatInr(price.base)}
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Sum of individual starting prices
                </span>
              </div>

              {/* Box 2: Discount Controls */}
              <div className="rounded-xl border-2 border-primary bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-primary">
                    Bundle Discount <span className="text-destructive">*</span>
                  </span>
                  {/* Discount type toggle */}
                  <div className="inline-flex rounded-lg border border-border p-0.5 text-[11px] bg-muted">
                    <button
                      type="button"
                      onClick={() => setDiscountType("percentage")}
                      className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
                        discountType === "percentage"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Percent className="h-3 w-3 inline -mt-0.5 mr-0.5" />%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("fixed_amount")}
                      className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors ${
                        discountType === "fixed_amount"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ₹ Flat
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-sm font-bold text-muted-foreground">
                    {discountType === "percentage" ? "%" : "₹"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={discountType === "percentage" ? 90 : Math.max(price.base - 1, 1)}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "15" : "25000"}
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 font-serif text-lg font-bold text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  {discountType === "percentage"
                    ? "Up to 90% discount allowed"
                    : `Must stay below ${formatInr(price.base)}`}
                </span>
              </div>

              {/* Box 3: Final Package Price & Savings Badge */}
              <div
                className={`rounded-xl border p-3.5 space-y-1 ${
                  price.discount > 0
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Final Package Price
                </span>
                <div className="font-serif text-xl sm:text-2xl font-extrabold">
                  {formatInr(price.total)}
                </div>
                <span className="text-[11px] font-semibold block">
                  {price.discount > 0
                    ? `🎯 Save ${formatInr(price.discount)} (${savingsPercentage}% OFF)`
                    : "Set discount to provide customer savings"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Optional Cover Image */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label htmlFor="pkg-cover-image" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              Package Cover Image URL (Optional)
            </Label>
            <Input
              id="pkg-cover-image"
              type="url"
              maxLength={500}
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/... or leave empty to use component media"
              className="rounded-xl border-border text-xs sm:text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Provide a hero photo for this combo bundle. If omitted, the first component listing&apos;s photo will represent the package.
            </p>

            {coverImage.trim() && (
              <div className="mt-2 h-36 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-muted">
                <img
                  src={coverImage.trim()}
                  alt="Package preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-border bg-muted/40 p-4 px-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/vendor/packages">Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || liveListings.length < 2}
            className="rounded-xl font-bold flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Package...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-accent" />
                <span>{isEdit ? "Review & Save Changes" : "Review & Submit Package"}</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {isConfirmationOpen && (
        <SubmissionConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmSubmit}
          isSubmitting={isSubmitting}
          details={{
            type: "combo_package",
            title: name.trim(),
            price: price.total,
            packagesCount: selectedListingIds.length,
            customDetails: [
              {
                label: "Services Included",
                value: `${selectedListingIds.length} listings (${selectedComponents
                  .map((c) => c.categories?.name ?? "Service")
                  .filter(Boolean)
                  .join(", ")})`,
              },
              {
                label: "Savings Provided",
                value: `Save ${formatInr(price.discount)} (${savingsPercentage}% OFF)`,
              },
              {
                label: "Moderation Status",
                value: isEdit ? "Returns to Pending Review upon edit" : "Queued for Admin Approval",
              },
            ],
          }}
        />
      )}
    </div>
  );
};
