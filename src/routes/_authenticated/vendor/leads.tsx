import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getVendorLeads } from "@/lib/vendor.functions";
import { updateRequestStatus, sendRequestMessage } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Phone,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/leads")({
  component: VendorLeads,
  head: () => ({
    meta: [
      { title: "Leads & enquiries | Celebratz" },
      { name: "description", content: "Review booking requests and enquiries from customers on Celebratz." },
      { property: "og:title", content: "Leads & enquiries | Celebratz" },
      { property: "og:description", content: "Review booking requests and enquiries from customers on Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "closed", label: "Closed" },
];

function VendorLeads() {
  const fetchLeads = useServerFn(getVendorLeads);
  const setStatus = useServerFn(updateRequestStatus);
  const sendReply = useServerFn(sendRequestMessage);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({ queryKey: ["vendor-leads"], queryFn: () => fetchLeads() });

  const statusMutation = useMutation({
    mutationFn: (vars: { requestId: string; status: "accepted" | "declined" | "closed"; note?: string }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update lead"),
  });

  const replyMutation = useMutation({
    mutationFn: (vars: { requestId: string; body: string }) =>
      sendReply({ data: vars }),
    onSuccess: () => {
      toast.success("Reply sent to customer");
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send reply"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.vendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Set up your business first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create your vendor profile to start receiving leads.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/vendor">Go to vendor hub</Link>
        </Button>
      </div>
    );
  }

  const leads = data.leads.filter((l: any) => filter === "all" || l.status === filter);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">Leads & enquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Accept a lead to unlock the review request after the event date, or decline to keep your pipeline clean.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              filter === f.value ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No leads in this view yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {leads.map((lead: any) => (
            <VendorLeadCard
              key={lead.id}
              lead={lead}
              onUpdateStatus={(status, note) =>
                statusMutation.mutate({ requestId: lead.id, status, note: note || undefined })
              }
              onSendReply={(body, reset) =>
                replyMutation.mutate({ requestId: lead.id, body }, { onSuccess: reset })
              }
              isUpdating={statusMutation.isPending}
              isReplying={replyMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VendorLeadCardProps {
  lead: any;
  onUpdateStatus: (status: "accepted" | "declined" | "closed", note?: string) => void;
  onSendReply: (body: string, reset: () => void) => void;
  isUpdating: boolean;
  isReplying: boolean;
}

function VendorLeadCard({
  lead,
  onUpdateStatus,
  onSendReply,
  isUpdating,
  isReplying,
}: VendorLeadCardProps) {
  const [decisionNote, setDecisionNote] = useState("");
  const [replyText, setReplyText] = useState("");

  const title = lead.listing?.title || lead.package?.name || "Booking Request";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base text-foreground">{lead.customer_name ?? "Guest Customer"}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {(lead.package?.name || lead.tier?.name) && (
            <p className="text-xs text-primary font-medium mt-0.5">
              {lead.package ? `Combo: ${lead.package.name}` : `Tier: ${lead.tier?.name}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {lead.kind === "booking_request" ? "Booking Request" : "Enquiry"}
          </Badge>
          {lead.status === "new" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/30">
              <Clock className="w-3 h-3" /> New
            </span>
          )}
          {lead.status === "accepted" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-subtle text-success border border-success/30">
              <CheckCircle2 className="w-3 h-3" /> Accepted
            </span>
          )}
          {lead.status === "declined" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive-subtle text-destructive border border-destructive/30">
              <XCircle className="w-3 h-3" /> Declined
            </span>
          )}
          {lead.status === "closed" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
              <AlertCircle className="w-3 h-3" /> Closed
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 pt-1">
        {lead.event_type && (
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            Celebration: {lead.event_type}
          </span>
        )}
        {lead.event_date && (
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" /> Event Date: {lead.event_date}
          </span>
        )}
        {lead.visit_date && (
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" /> Preferred Visit: {lead.visit_date}
            {lead.visit_time ? ` at ${String(lead.visit_time).slice(0, 5)}` : ""}
          </span>
        )}
        {lead.guest_count && <span>Estimated Guests: ~{lead.guest_count}</span>}
        {lead.phone_snapshot && (
          <a href={`tel:${lead.phone_snapshot}`} className="flex items-center gap-2 text-primary font-medium hover:underline">
            <Phone className="h-4 w-4 shrink-0" /> {lead.phone_snapshot}
          </a>
        )}
      </div>

      {lead.message && (
        <div className="rounded-xl bg-muted/40 p-3 text-xs border border-border text-foreground">
          <div className="flex gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <span className="font-bold text-foreground">Initial Enquiry:</span> "{lead.message}"
            </div>
          </div>
        </div>
      )}

      {/* Decision form for new leads */}
      {lead.status === "new" && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Response Note to Customer (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Dates available! Let's arrange a walkthrough or call..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:bg-card resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-xl text-xs font-bold"
              disabled={isUpdating}
              onClick={() => {
                onUpdateStatus("accepted", decisionNote.trim());
                setDecisionNote("");
              }}
            >
              Accept Lead
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs font-bold"
              disabled={isUpdating}
              onClick={() => {
                onUpdateStatus("declined", decisionNote.trim());
                setDecisionNote("");
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {lead.status === "accepted" && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-semibold"
            disabled={isUpdating}
            onClick={() => onUpdateStatus("closed")}
          >
            Mark as closed
          </Button>
        </div>
      )}

      {/* Message Thread History */}
      <div className="pt-3 border-t border-border space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Conversation & Updates
        </h4>

        {(lead.request_messages ?? []).length > 0 ? (
          <div className="space-y-2">
            {lead.request_messages.map((msg: any) => {
              const isCustomer = msg.sender_id === lead.customer_id;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl p-3 text-xs border ${
                    isCustomer
                      ? "bg-muted/40 border-border text-foreground"
                      : "bg-primary-subtle/40 border-primary/20 text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {isCustomer ? lead.customer_name || "Customer" : "You (Vendor)"}
                    </span>
                    <span>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No follow-up messages yet.</p>
        )}

        {/* Small Reply Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            onSendReply(replyText.trim(), () => setReplyText(""));
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Type a message or update to the customer..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-hidden focus:border-primary focus:bg-card"
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-xl text-xs font-bold shrink-0"
            disabled={isReplying || !replyText.trim()}
          >
            {isReplying && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Send Reply
          </Button>
        </form>
      </div>
    </div>
  );
}
