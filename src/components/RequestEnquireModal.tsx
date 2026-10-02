import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Send,
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  User as UserIcon,
  Mail,
  Package as PackageIcon,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  submitRequest,
  submitRequestAsUser,
  getRequestTarget,
} from "@/lib/requests.functions";
import { getPackagesForListing } from "@/lib/packages.functions";
import { computePackagePrice, formatInr, unitLabel } from "@/lib/pricing";
import { useModalScrollLock, forceUnlockBodyScroll } from "@/hooks/useModalScrollLock";
import { Checkbox } from "@/components/ui/checkbox";

export interface RequestEnquireModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: {
    id: string;
    title: string;
    slug?: string;
    locality?: string | { name: string; slug: string } | null;
    areas?: { name: string; slug: string } | null;
    startingPrice?: number | null;
    price_from?: number | null;
    price_unit?: string | null;
    pricingNote?: string | null;
    coverImage?: string | null;
    listing_media?: Array<{ storage_path: string }> | null;
    vendorName?: string | null;
    vendors?: {
      id?: string;
      business_name?: string | null;
      about?: string | null;
      contact_phone?: string | null;
      contact_email?: string | null;
    } | null;
    listing_tiers?: Array<{
      id: string;
      name: string;
      description?: string | null;
      price: number | string | null;
      features?: string[] | null;
      is_active?: boolean | null;
      badge?: string | null;
      sort_order?: number;
    }> | null;
  } | null;
  package?: {
    id: string;
    name?: string;
    title?: string;
    slug?: string;
    discount_type?: string | null;
    discount_value?: number | null;
    cover_image?: string | null;
    vendor?: {
      id?: string;
      business_name?: string | null;
    } | null;
    components?: any[];
  } | null;
  listingId?: string | null;
  packageId?: string | null;
  initialKind?: "booking_request" | "enquiry";
  prefillTierId?: string | null;
  prefillPackageId?: string | null;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Birthday",
  "Engagement",
  "Naming Ceremony",
  "Corporate Event",
] as const;

export const RequestEnquireModal: React.FC<RequestEnquireModalProps> = ({
  isOpen,
  onClose,
  listing: initialListing,
  package: initialPackage,
  listingId: propListingId,
  packageId: propPackageId,
  initialKind = "booking_request",
  prefillTierId,
  prefillPackageId,
  onSuccess,
}) => {
  const navigate = useNavigate();

  // Determine effective IDs
  const effectiveListingId = initialListing?.id || propListingId || null;
  const effectivePackageId = initialPackage?.id || propPackageId || null;

  // Fallback target fetching via getRequestTarget if only IDs were passed
  const fetchTarget = useServerFn(getRequestTarget);
  const { data: remoteTarget } = useQuery({
    queryKey: ["request-target", effectiveListingId, effectivePackageId],
    queryFn: () =>
      fetchTarget({
        data: {
          listingId: effectiveListingId || undefined,
          packageId: effectivePackageId || undefined,
        },
      }),
    enabled: Boolean(
      isOpen &&
        ((effectiveListingId && !initialListing) || (effectivePackageId && !initialPackage)),
    ),
  });

  const listing: NonNullable<RequestEnquireModalProps["listing"]> | null =
    initialListing ||
    (remoteTarget?.type === "listing"
      ? (remoteTarget.listing as NonNullable<RequestEnquireModalProps["listing"]>)
      : null);
  const pkgTarget: NonNullable<RequestEnquireModalProps["package"]> | null =
    initialPackage ||
    (remoteTarget?.type === "package"
      ? (remoteTarget.pkg as NonNullable<RequestEnquireModalProps["package"]>)
      : null);

  // Fetch combo packages for the listing
  const fetchCombos = useServerFn(getPackagesForListing);
  const { data: relatedPackages = [] } = useQuery({
    queryKey: ["packages-for-listing", listing?.id],
    queryFn: () => fetchCombos({ data: { listingId: listing!.id } }),
    enabled: Boolean(isOpen && listing?.id),
  });

  // Server functions for submission
  const sendGuestRequest = useServerFn(submitRequest);
  const sendUserRequest = useServerFn(submitRequestAsUser);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // Form State
  const [requestType, setRequestType] = useState<"request_to_book" | "general_enquiry">(
    initialKind === "booking_request" ? "request_to_book" : "general_enquiry",
  );
  const [eventType, setEventType] = useState<string>("Wedding");
  const [eventDate, setEventDate] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number | "">("");
  const [preferredVisitDate, setPreferredVisitDate] = useState<string>("");
  const [preferredVisitTimeSlot, setPreferredVisitTimeSlot] = useState<string>(
    "04:00 PM - 06:00 PM (Evening Slot)",
  );
  const [message, setMessage] = useState<string>("");
  const [showPackagePicker, setShowPackagePicker] = useState<boolean>(true);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);

  // Package / Tier selection state
  const [activePackageData, setActivePackageData] = useState<{
    tierId?: string;
    packageName?: string;
    packagePrice?: number;
    comboPackageId?: string;
    comboPackageTitle?: string;
    comboPrice?: number;
  } | null>(null);

  // Contact & Double-Entry Phone State
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>(""); // UI-only field per requirement 4
  const [phonePrimary, setPhonePrimary] = useState<string>("");
  const [phoneConfirm, setPhoneConfirm] = useState<string>("");
  const [consentGiven, setConsentGiven] = useState<boolean>(true);

  // Submission Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    onClose();
    setIsSubmitted(false);
    setErrorMessage(null);
  }, [onClose]);

  useModalScrollLock(isOpen, handleClose);

  // Check authentication & prefill profile data on modal open
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const hasSession = Boolean(data.session);
      setSignedIn(hasSession);

      if (data.session) {
        if (data.session.user.email) {
          setCustomerEmail((prev) => prev || data.session!.user.email || "");
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", data.session.user.id)
          .maybeSingle();

        if (!active || !profile) return;
        if (profile.full_name) setCustomerName((prev) => prev || profile.full_name || "");
        if (profile.phone) {
          const digits = profile.phone.replace(/\D/g, "").slice(-10);
          if (digits.length === 10) {
            setPhonePrimary((prev) => prev || digits);
            setPhoneConfirm((prev) => prev || digits);
          }
        }
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Handle initial tier / package prefilling
  useEffect(() => {
    if (!isOpen) return;

    if (pkgTarget) {
      const price = computePackagePrice(
        pkgTarget.components || [],
        pkgTarget.discount_type === "fixed_amount" ? "fixed_amount" : "percentage",
        pkgTarget.discount_value,
      );
      setActivePackageData({
        comboPackageId: pkgTarget.id,
        comboPackageTitle: pkgTarget.name || pkgTarget.title,
        comboPrice: price.total,
      });
      setMessage(
        `Hello, I am interested in booking the "${pkgTarget.name || pkgTarget.title}" package. Please share details on availability and customisation.`,
      );
      return;
    }

    if (listing) {
      const activeTiers = (listing.listing_tiers || []).filter((t) => t.is_active !== false);
      if (prefillTierId) {
        const tier = activeTiers.find((t) => t.id === prefillTierId);
        if (tier) {
          setActivePackageData({
            tierId: tier.id,
            packageName: tier.name,
            packagePrice: Number(tier.price ?? 0),
          });
          setMessage(
            `Hello, I am interested in the "${tier.name}" tier. Please confirm slot availability and payment terms.`,
          );
        }
      } else if (prefillPackageId) {
        const combo = (relatedPackages || []).find((p: any) => p.id === prefillPackageId);
        if (combo) {
          const comboPrice = computePackagePrice(
            combo.components || [],
            combo.discount_type === "fixed_amount" ? "fixed_amount" : "percentage",
            combo.discount_value,
          );
          setActivePackageData({
            comboPackageId: combo.id,
            comboPackageTitle: combo.name || combo.title,
            comboPrice: comboPrice.total,
          });
          setMessage(
            `Hello, I am interested in booking the "${combo.name || combo.title}" all-in-one combo package. Please share details on availability and customisation.`,
          );
        }
      }
    }
  }, [isOpen, listing, pkgTarget, prefillTierId, prefillPackageId, relatedPackages]);

  if (!isOpen) return null;

  // Active tiers from listing
  const activeTiers = (listing?.listing_tiers || [])
    .filter((t) => t.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const hasAvailablePackages = activeTiers.length > 0 || (relatedPackages && relatedPackages.length > 0);

  // Target summary data
  const targetTitle = listing?.title || pkgTarget?.name || pkgTarget?.title || "Celebration Request";
  const targetCoverImage =
    listing?.coverImage ||
    listing?.listing_media?.[0]?.storage_path ||
    pkgTarget?.cover_image ||
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80";

  const targetLocality =
    typeof listing?.locality === "string"
      ? listing.locality
      : listing?.locality?.name || listing?.areas?.name || "Pune";

  const targetVendorName =
    listing?.vendorName ||
    listing?.vendors?.business_name ||
    pkgTarget?.vendor?.business_name ||
    "Vendor";

  const startingPriceDisplay =
    listing?.price_from != null
      ? formatInr(listing.price_from)
      : listing?.startingPrice != null
      ? formatInr(listing.startingPrice)
      : null;

  const handleSelectTier = (tier: any) => {
    const isCurrentlySelected = activePackageData?.tierId === tier.id;
    if (isCurrentlySelected) {
      handleRemovePackage();
      return;
    }

    setActivePackageData({
      tierId: tier.id,
      packageName: tier.name,
      packagePrice: Number(tier.price ?? 0),
    });
    setMessage(
      `Hello, I am interested in the "${tier.name}" tier (${formatInr(tier.price)}). Please confirm slot availability and payment terms.`,
    );
  };

  const handleSelectCombo = (combo: any) => {
    const isCurrentlySelected = activePackageData?.comboPackageId === combo.id;
    if (isCurrentlySelected) {
      handleRemovePackage();
      return;
    }

    const price = computePackagePrice(
      combo.components || [],
      combo.discount_type === "fixed_amount" ? "fixed_amount" : "percentage",
      combo.discount_value,
    );
    setActivePackageData({
      comboPackageId: combo.id,
      comboPackageTitle: combo.name || combo.title,
      comboPrice: price.total,
    });
    setMessage(
      `Hello, I am interested in booking the "${combo.name || combo.title}" all-in-one combo package (${formatInr(price.total)}). Please share details on availability and customisation.`,
    );
  };

  const handleRemovePackage = () => {
    setActivePackageData(null);
    setMessage(
      `Hello, I would like to inquire about availability and pricing for my upcoming ${eventType} celebration.`,
    );
  };

  const handlePhonePrimaryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhonePrimary(cleaned);
  };

  const handlePhoneConfirmChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhoneConfirm(cleaned);
  };

  const isPhoneMatching =
    phonePrimary.length === 10 && phoneConfirm.length === 10 && phonePrimary === phoneConfirm;
  const isPhoneMismatch = phoneConfirm.length > 0 && phonePrimary !== phoneConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!effectiveListingId && !effectivePackageId) {
      setErrorMessage("No target selected to request.");
      return;
    }
    if (!eventDate) {
      setErrorMessage("Please pick an event date.");
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (phonePrimary.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (phonePrimary !== phoneConfirm) {
      setErrorMessage("Phone numbers do not match. Please verify double-entry.");
      return;
    }
    if (!consentGiven) {
      setErrorMessage("Please provide consent to share your contact details with the vendor.");
      return;
    }

    // Determine target branching per rule 2 & rule 5
    const isPackageTarget = Boolean(
      activePackageData?.comboPackageId || (!effectiveListingId && effectivePackageId),
    );
    const finalPackageId = isPackageTarget
      ? activePackageData?.comboPackageId || effectivePackageId || undefined
      : undefined;
    const finalListingId = isPackageTarget ? undefined : effectiveListingId || undefined;
    const finalTierId =
      !isPackageTarget && activePackageData?.tierId ? activePackageData.tierId : undefined;

    setIsSubmitting(true);
    try {
      const send = signedIn ? sendUserRequest : sendGuestRequest;
      await send({
        data: {
          listingId: finalListingId,
          packageId: finalPackageId,
          selectedTierId: finalTierId,
          kind: requestType === "request_to_book" ? "booking_request" : "enquiry",
          eventDate,
          visitDate: preferredVisitDate || undefined,
          visitTime: preferredVisitTimeSlot || undefined,
          message: message.trim() || undefined,
          guestCount: guestCount ? Number(guestCount) : undefined,
          customerName: customerName.trim(),
          customerPhone: phonePrimary.trim(),
          customerPhoneConfirm: phoneConfirm.trim(),
        },
      });

      setIsSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="request-enquiry-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        id="request-enquiry-dialog"
        className="bg-card rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-border overflow-hidden relative text-left"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/80 sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
              Direct Vendor Connect &bull; Pune
            </span>
            <h3
              id="enquiry-modal-title"
              className="font-serif font-bold text-lg text-foreground leading-tight"
            >
              {requestType === "request_to_book"
                ? "Request to Book / Venue Visit"
                : "Send General Enquiry"}
            </h3>
          </div>

          <button
            id="close-enquiry-modal-button"
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-extrabold text-2xl text-foreground">
              Request Sent to {targetVendorName}!
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We’ve dispatched your event details to the vendor management. They will review your
              dates and reach out to you via phone/WhatsApp at{" "}
              <span className="font-bold text-foreground">+91 {phonePrimary}</span> to confirm visit
              slots and pricing.
            </p>

            {activePackageData &&
              (activePackageData.packageName || activePackageData.comboPackageTitle) && (
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs text-primary max-w-sm mx-auto font-medium">
                  Attached:{" "}
                  <span className="font-bold">
                    {activePackageData.comboPackageTitle || activePackageData.packageName}
                  </span>
                  {(activePackageData.comboPrice || activePackageData.packagePrice) && (
                    <span className="ml-1 font-bold">
                      (
                      {formatInr(
                        activePackageData.comboPrice || activePackageData.packagePrice || 0,
                      )}
                      )
                    </span>
                  )}
                </div>
              )}

            <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground max-w-sm mx-auto">
              You can track all status updates anytime in your{" "}
              <span className="font-semibold text-primary">Customer Dashboard</span>.
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                id="view-my-requests-button"
                type="button"
                onClick={() => {
                  handleClose();
                  forceUnlockBodyScroll();
                  navigate({ to: "/dashboard" });
                }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Go to My Dashboard
              </button>
              <button
                id="keep-browsing-button"
                type="button"
                onClick={() => {
                  handleClose();
                  forceUnlockBodyScroll();
                }}
                className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        ) : (
          <form
            id="enquiry-form"
            onSubmit={handleSubmit}
            className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 text-left"
          >
            {/* Vendor Mini Card Summary */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/10 border border-accent/30">
              <img
                src={targetCoverImage}
                alt=""
                className="w-12 h-12 rounded-xl object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {targetTitle}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {targetLocality}, Pune &bull;{" "}
                  {startingPriceDisplay ? `From ${startingPriceDisplay}` : "Verified Vendor"}
                </p>
              </div>
            </div>

            {/* PACKAGE SELECTION & MANAGEMENT SECTION */}
            {hasAvailablePackages ? (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/60 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-primary" />
                    <div>
                      <span className="text-xs font-bold text-foreground block leading-tight">
                        Package / Pricing Tier
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {activePackageData
                          ? "Customized package selected"
                          : "Choose a package or request custom pricing"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activePackageData && (
                      <button
                        type="button"
                        id="remove-selected-package-btn"
                        onClick={handleRemovePackage}
                        className="text-[11px] font-bold text-destructive hover:opacity-90 bg-destructive/10 hover:bg-destructive/15 border border-destructive/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remove package and request general quote"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Package</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowPackagePicker((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
                      title={showPackagePicker ? "Collapse packages" : "Expand packages"}
                    >
                      {showPackagePicker ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Package Banner */}
                {activePackageData &&
                  (activePackageData.packageName || activePackageData.comboPackageTitle) && (
                    <div className="p-3 bg-primary/10 rounded-xl border-2 border-primary/50 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-primary text-accent flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {activePackageData.comboPackageTitle ? "🌟" : "✓"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                              {activePackageData.comboPackageTitle
                                ? "All-in-One Multi-Service Combo"
                                : "Attached Package Tier"}
                            </span>
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded-full font-bold">
                              Selected
                            </span>
                          </div>
                          <h5 className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {activePackageData.comboPackageTitle || activePackageData.packageName}
                            {activePackageData.comboPrice || activePackageData.packagePrice ? (
                              <span className="text-primary font-serif font-extrabold ml-1.5">
                                (
                                {formatInr(
                                  activePackageData.comboPrice ||
                                    activePackageData.packagePrice ||
                                    0,
                                )}
                                )
                              </span>
                            ) : null}
                          </h5>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="clear-package-banner-btn"
                        onClick={handleRemovePackage}
                        className="text-muted-foreground hover:text-destructive text-xs px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer font-semibold flex items-center gap-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  )}

                {/* Package Options Grid */}
                {showPackagePicker && (
                  <div className="space-y-2 pt-1">
                    {/* Option 0: No Package (Base Quote) */}
                    <div
                      onClick={handleRemovePackage}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        !activePackageData
                          ? "bg-primary/10 border-primary ring-1 ring-primary shadow-2xs"
                          : "bg-card border-border hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            !activePackageData
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card"
                          }`}
                        >
                          {!activePackageData && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <h6 className="font-bold text-xs text-foreground">
                            General Inquiry / Custom Quote
                          </h6>
                          <p className="text-[10px] text-muted-foreground">
                            No specific package attached &bull; Request custom pricing based on
                            requirements
                          </p>
                        </div>
                      </div>
                      {startingPriceDisplay && (
                        <span className="text-xs font-bold text-muted-foreground shrink-0">
                          From {startingPriceDisplay}
                        </span>
                      )}
                    </div>

                    {/* Listing Pricing Tier Packages */}
                    {activeTiers.map((tier, idx) => {
                      const isSelected = activePackageData?.tierId === tier.id;
                      const isExpanded = expandedPackageId === `tier_${tier.id}`;

                      return (
                        <div
                          key={tier.id || `tier_${idx}`}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSelected
                              ? "bg-accent/10 border-accent ring-1 ring-accent shadow-2xs"
                              : "bg-card border-border hover:border-border"
                          }`}
                        >
                          <div
                            onClick={() => handleSelectTier(tier)}
                            className="p-3 cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-accent bg-accent text-accent-foreground"
                                    : "border-border bg-card"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h6 className="font-bold text-xs text-foreground">{tier.name}</h6>
                                  {tier.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-accent/20 text-accent-dark border border-accent/40 rounded-full">
                                      {tier.badge}
                                    </span>
                                  )}
                                </div>
                                {tier.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                                    {tier.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <span className="font-serif font-extrabold text-xs sm:text-sm text-primary block">
                                  {formatInr(tier.price)}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  /{unitLabel(listing?.price_unit || "event")}
                                </span>
                              </div>

                              {tier.features && tier.features.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPackageId((prev) =>
                                      prev === `tier_${tier.id}` ? null : `tier_${tier.id}`,
                                    );
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted text-[10px] cursor-pointer"
                                  title="View inclusions"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Features List */}
                          {isExpanded && tier.features && tier.features.length > 0 && (
                            <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/30 space-y-1">
                              <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">
                                Package Inclusions:
                              </span>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-foreground">
                                {tier.features.map((feat: string, fi: number) => (
                                  <li key={fi} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* All-in-One Multi-Service Combo Packages */}
                    {relatedPackages.map((combo: any) => {
                      const isSelected = activePackageData?.comboPackageId === combo.id;
                      const isExpanded = expandedPackageId === `combo_${combo.id}`;
                      const comboPrice = computePackagePrice(
                        combo.components || [],
                        combo.discount_type === "fixed_amount" ? "fixed_amount" : "percentage",
                        combo.discount_value,
                      ).total;
                      const originalPrice = (combo.components || []).reduce(
                        (sum: number, c: any) => sum + Number(c.price_from ?? 0),
                        0,
                      );
                      const savings = Math.max(0, originalPrice - comboPrice);
                      const savingsPct =
                        originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

                      return (
                        <div
                          key={`combo_${combo.id}`}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSelected
                              ? "bg-accent/10 border-accent ring-1 ring-accent shadow-2xs"
                              : "bg-card border-accent/30 hover:border-accent/60"
                          }`}
                        >
                          <div
                            onClick={() => handleSelectCombo(combo)}
                            className="p-3 cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-accent bg-accent text-accent-foreground"
                                    : "border-accent/40 bg-card"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-primary text-primary-foreground rounded-full flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Combo
                                  </span>
                                  <h6 className="font-bold text-xs text-foreground">
                                    {combo.name || combo.title}
                                  </h6>
                                </div>
                                {combo.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                                    {combo.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <div className="flex items-baseline gap-1 justify-end">
                                  <span className="font-serif font-extrabold text-xs sm:text-sm text-primary">
                                    {formatInr(comboPrice)}
                                  </span>
                                  {originalPrice > comboPrice && (
                                    <span className="text-[9px] text-muted-foreground line-through">
                                      {formatInr(originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {savings > 0 && (
                                  <span className="text-[9px] font-bold text-success block">
                                    Save {formatInr(savings)} ({savingsPct}% OFF)
                                  </span>
                                )}
                              </div>

                              {combo.components && combo.components.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPackageId((prev) =>
                                      prev === `combo_${combo.id}` ? null : `combo_${combo.id}`,
                                    );
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted text-[10px] cursor-pointer"
                                  title="View bundled services"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Combo Inclusions */}
                          {isExpanded && combo.components && combo.components.length > 0 && (
                            <div className="px-3 pb-3 pt-1 border-t border-accent/20 bg-accent/5 space-y-1">
                              <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider block">
                                Included Services in this Combo:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {combo.components.map((srv: any, si: number) => (
                                  <div
                                    key={si}
                                    className="px-2 py-1 rounded-lg bg-card border border-accent/30 text-[10px] text-foreground flex items-center gap-1"
                                  >
                                    <span className="font-bold text-primary uppercase text-[9px]">
                                      {srv.categories?.name || "Service"}:
                                    </span>
                                    <span className="truncate max-w-[150px]">{srv.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Request Mode Toggle */}
            <div
              role="tablist"
              aria-label="Enquiry kind"
              className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-semibold"
            >
              <button
                type="button"
                role="tab"
                id="request-to-book-tab"
                aria-selected={requestType === "request_to_book"}
                onClick={() => setRequestType("request_to_book")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  requestType === "request_to_book"
                    ? "bg-card text-primary shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📅 Request to Book / Visit
              </button>
              <button
                type="button"
                role="tab"
                id="general-enquiry-tab"
                aria-selected={requestType === "general_enquiry"}
                onClick={() => setRequestType("general_enquiry")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  requestType === "general_enquiry"
                    ? "bg-card text-primary shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💬 General Enquiry
              </button>
            </div>

            {/* 1. Celebration Type & Event Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="enquiry-event-type"
                  className="block text-[11px] uppercase font-bold text-foreground mb-1"
                >
                  Celebration Type *
                </label>
                <select
                  id="enquiry-event-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden cursor-pointer"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="enquiry-event-date"
                  className="block text-[11px] uppercase font-bold text-foreground mb-1"
                >
                  Event Date *
                </label>
                <input
                  id="enquiry-event-date"
                  type="date"
                  required
                  value={eventDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden"
                />
              </div>
            </div>

            {/* 2. Guest Count & Preferred Visit Slot */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="enquiry-guest-count"
                    className="block text-[11px] uppercase font-bold text-foreground mb-1"
                  >
                    Estimated Guests (Optional)
                  </label>
                  <input
                    id="enquiry-guest-count"
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="enquiry-visit-date"
                    className="block text-[11px] uppercase font-bold text-foreground mb-1"
                  >
                    Preferred Visit / Call Date
                  </label>
                  <input
                    id="enquiry-visit-date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={preferredVisitDate}
                    onChange={(e) => setPreferredVisitDate(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden"
                  />
                </div>
              </div>

              {/* Visit Time Window */}
              <div>
                <label
                  htmlFor="enquiry-visit-slot"
                  className="block text-[11px] uppercase font-bold text-foreground mb-1"
                >
                  Preferred Time Window
                </label>
                <select
                  id="enquiry-visit-slot"
                  value={preferredVisitTimeSlot}
                  onChange={(e) => setPreferredVisitTimeSlot(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden cursor-pointer"
                >
                  <option value="10:00 AM - 12:00 PM (Morning Slot)">
                    ☀️ Morning Slot (10:00 AM - 12:00 PM)
                  </option>
                  <option value="12:00 PM - 02:00 PM (Early Afternoon)">
                    🌤️ Early Afternoon (12:00 PM - 02:00 PM)
                  </option>
                  <option value="02:00 PM - 04:00 PM (Late Afternoon)">
                    ⛅ Late Afternoon (02:00 PM - 04:00 PM)
                  </option>
                  <option value="04:00 PM - 06:00 PM (Evening Slot)">
                    🌇 Evening Slot (04:00 PM - 06:00 PM)
                  </option>
                  <option value="06:00 PM - 08:00 PM (Night Slot)">
                    🌙 Night Slot (06:00 PM - 08:00 PM)
                  </option>
                </select>
              </div>
            </div>

            {/* 3. Name & Email (UI-only field with no backend persistence) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="enquiry-customer-name"
                  className="block text-[11px] uppercase font-bold text-foreground mb-1"
                >
                  Your Full Name *
                </label>
                <div className="flex items-center bg-muted/40 border border-border rounded-xl px-2.5 py-1.5 focus-within:border-primary">
                  <UserIcon className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    id="enquiry-customer-name"
                    type="text"
                    required
                    placeholder="Priya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-transparent text-xs text-foreground outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="enquiry-customer-email"
                  className="block text-[11px] uppercase font-bold text-foreground mb-1"
                >
                  Email Address *
                </label>
                <div className="flex items-center bg-muted/40 border border-border rounded-xl px-2.5 py-1.5 focus-within:border-primary">
                  <Mail className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    id="enquiry-customer-email"
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-transparent text-xs text-foreground outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 4. DOUBLE-ENTRY PHONE NUMBER VALIDATION */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div>
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Contact Mobile Number (Double-Entry Verification)
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  To ensure the vendor can reach you without SMS OTP delays, please enter your
                  10-digit number twice.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Input 1 */}
                <div>
                  <label
                    htmlFor="enquiry-phone-primary"
                    className="block text-[10px] font-bold text-muted-foreground uppercase mb-1"
                  >
                    Mobile Number (+91) *
                  </label>
                  <div className="flex items-center bg-card border border-border rounded-xl px-3 py-2 focus-within:border-primary">
                    <span className="text-xs font-bold text-muted-foreground mr-1.5">+91</span>
                    <input
                      id="enquiry-phone-primary"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      placeholder="9823045678"
                      value={phonePrimary}
                      onChange={(e) => handlePhonePrimaryChange(e.target.value)}
                      className="w-full bg-transparent text-xs font-medium text-foreground outline-hidden"
                    />
                  </div>
                </div>

                {/* Input 2 (Re-enter) */}
                <div>
                  <label
                    htmlFor="enquiry-phone-confirm"
                    className="block text-[10px] font-bold text-muted-foreground uppercase mb-1"
                  >
                    Re-Enter Number to Confirm *
                  </label>
                  <div
                    className={`flex items-center bg-card border rounded-xl px-3 py-2 transition-colors ${
                      isPhoneMatching
                        ? "border-success bg-success/10"
                        : isPhoneMismatch
                        ? "border-destructive/50 bg-destructive/10"
                        : "border-border"
                    }`}
                  >
                    <span className="text-xs font-bold text-muted-foreground mr-1.5">+91</span>
                    <input
                      id="enquiry-phone-confirm"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      placeholder="Type again..."
                      value={phoneConfirm}
                      onChange={(e) => handlePhoneConfirmChange(e.target.value)}
                      className="w-full bg-transparent text-xs font-medium text-foreground outline-hidden"
                    />
                    {isPhoneMatching && (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              </div>

              {isPhoneMismatch && (
                <div className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Numbers do not match yet. Please double-check for typos.</span>
                </div>
              )}
            </div>

            {/* 5. Message Note */}
            <div>
              <label
                htmlFor="enquiry-message"
                className="block text-[11px] uppercase font-bold text-foreground mb-1"
              >
                Custom Requirements or Message (Optional)
              </label>
              <textarea
                id="enquiry-message"
                rows={2}
                maxLength={1000}
                placeholder="e.g. Inquiring about stage decoration options and outside catering permission..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground font-medium focus:border-primary outline-hidden resize-none"
              />
            </div>

            {/* 6. MANDATORY EXPLICIT CONSENT CLAUSE */}
            <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 space-y-2">
              <label
                htmlFor="enquiry-consent-checkbox"
                className="flex items-start gap-2.5 cursor-pointer"
              >
                <Checkbox
                  id="enquiry-consent-checkbox"
                  checked={consentGiven}
                  onCheckedChange={(c) => setConsentGiven(c === true)}
                />
                <span className="text-[11px] text-foreground leading-snug font-medium">
                  I agree that my name and contact number (+91 {phonePrimary || "XXXXXXXXXX"}) will
                  be shared directly with{" "}
                  <span className="font-bold text-foreground">{targetVendorName}</span> so they can
                  contact me about this event request.
                </span>
              </label>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="submit-enquiry-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary-dark text-primary-foreground shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-accent" />
                <span>
                  {isSubmitting
                    ? "Submitting..."
                    : `Send Request to ${targetVendorName}`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
