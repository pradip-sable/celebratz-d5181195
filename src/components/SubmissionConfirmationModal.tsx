import React, { useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, X, Building2, Gift, MapPin } from "lucide-react";
import { formatInr, unitLabel } from "@/lib/pricing";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

export interface SubmissionDetails {
  type: "new_listing" | "edit_listing" | "add_tier" | "delete_tier" | "combo_package";
  title: string;
  category?: string;
  locality?: string;
  price?: number;
  pricingUnit?: string;
  packagesCount?: number;
  photosCount?: number;
  customDetails?: { label: string; value: string }[];
}

export interface SubmissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  details: SubmissionDetails;
  isSubmitting?: boolean;
}

export const SubmissionConfirmationModal: React.FC<SubmissionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  details,
  isSubmitting = false,
}) => {
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);

  useModalScrollLock(isOpen, onClose, {
    scrollToTopOnClose:
      hasConfirmed && (details.type === "new_listing" || details.type === "edit_listing"),
    restoreScroll: !hasConfirmed,
  });

  const handleConfirmAction = () => {
    setHasConfirmed(true);
    onConfirm();
  };

  if (!isOpen) return null;

  const getTypeHeading = () => {
    switch (details.type) {
      case "new_listing":
        return "Confirm New Listing Submission";
      case "edit_listing":
        return "Confirm Listing Modifications";
      case "add_tier":
        return "Confirm Package Tier Submission";
      case "delete_tier":
        return "Confirm Package Tier Removal";
      case "combo_package":
        return "Confirm Combo Package Submission";
      default:
        return "Confirm Submission";
    }
  };

  const formattedUnit = details.pricingUnit
    ? unitLabel(details.pricingUnit) || details.pricingUnit.replace("per_", "")
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card rounded-3xl border border-border shadow-2xl max-w-lg w-full overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-primary text-primary-foreground p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-1.5 rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent text-accent-foreground">
              Admin Verification Required
            </span>
          </div>

          <h3 className="font-serif font-bold text-xl sm:text-2xl text-primary-foreground pr-8">
            {getTypeHeading()}
          </h3>
          <p className="text-xs text-primary-foreground/80 font-light mt-1">
            Please review the submission requirements and 24-hour edit policy below.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Submission Preview Card */}
          <div className="bg-muted/50 rounded-2xl border border-border p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                {details.category && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-primary-subtle text-primary inline-block mb-1">
                    {details.category}
                  </span>
                )}
                <h4 className="font-serif font-bold text-base text-foreground leading-snug">
                  {details.title}
                </h4>
              </div>
              {details.price !== undefined && (
                <div className="text-right shrink-0">
                  <div className="font-serif font-extrabold text-sm sm:text-base text-primary">
                    {formatInr(details.price)}
                  </div>
                  {formattedUnit && (
                    <div className="text-[10px] text-muted-foreground font-medium">
                      /{formattedUnit}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border-subtle text-xs text-muted-foreground">
              {details.locality && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {details.locality}
                </span>
              )}
              {details.packagesCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Gift className="w-3 h-3 text-accent" />
                  {details.packagesCount} Package Tier{details.packagesCount !== 1 ? "s" : ""}
                </span>
              )}
              {details.photosCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-primary" />
                  {details.photosCount} Photo{details.photosCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {details.customDetails && details.customDetails.length > 0 && (
              <div className="pt-2 border-t border-border-subtle space-y-1">
                {details.customDetails.map((cd, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{cd.label}:</span>
                    <span className="font-semibold text-foreground">{cd.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy Callout 1: Approval Queue */}
          <div className="p-3.5 rounded-2xl bg-accent-subtle border border-accent/40 flex gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent-dark flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-accent-dark" />
            </div>
            <div className="space-y-0.5 text-xs text-accent-dark">
              <p className="font-bold text-accent-dark">1. Placed in Admin Approval Queue</p>
              <p className="text-foreground leading-relaxed font-normal">
                Your listing and pricing packages will be reviewed by the Celebratz moderation team
                before appearing live to customers.
              </p>
            </div>
          </div>

          {/* Policy Callout 2: 24-Hour Edit Restriction */}
          <div className="p-3.5 rounded-2xl bg-primary-subtle border border-border-subtle flex gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-0.5 text-xs text-primary">
              <p className="font-bold text-primary">2. 24-Hour Edit Restriction</p>
              <p className="text-foreground leading-relaxed font-normal">
                To ensure pricing consistency and prevent listing churn,{" "}
                <strong>you can only edit this listing and its packages once every 24 hours</strong>
                . Further modifications will unlock 24 hours from submission.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel & Review Again
          </button>
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Submitting for Approval...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>Confirm & Submit for Approval</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
