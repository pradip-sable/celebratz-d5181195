import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Phone, User, MessageSquare, Check, AlertCircle } from "lucide-react";
import { z } from "zod";
import { submitRequest } from "@/lib/requests.functions";
import { Button } from "@/components/ui/button";

const requestSchema = z.object({
  listing: z.string().optional(),
  kind: z.enum(["booking", "enquiry"]).optional(),
});

export const Route = createFileRoute("/request")({
  component: RequestPage,
  validateSearch: requestSchema,
  head: () => ({
    meta: [
      { title: "Request to Book | Celebratz" },
      { name: "description", content: "Send a booking request or enquiry to a Pune celebration vendor." },
      { property: "og:title", content: "Request to Book | Celebratz" },
      { property: "og:description", content: "Send a booking request or enquiry to a Pune celebration vendor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RequestPage() {
  const search = useSearch({ from: "/request" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    listingId: search.listing ?? "",
    kind: search.kind ?? "booking",
    eventDate: "",
    visitDate: "",
    visitTime: "",
    message: "",
    customerName: "",
    customerPhone: "",
    customerPhoneConfirm: "",
    consent: false,
  });

  const sendRequest = useServerFn(submitRequest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.listingId) {
      setError("No listing selected.");
      return;
    }
    if (form.customerPhone !== form.customerPhoneConfirm) {
      setError("Phone numbers do not match.");
      return;
    }
    if (!form.consent) {
      setError("Please agree to share your contact details with the vendor.");
      return;
    }

    try {
      await sendRequest({
        data: {
          listingId: form.listingId,
          kind: form.kind as "booking" | "enquiry",
          eventDate: form.eventDate,
          visitDate: form.visitDate,
          visitTime: form.visitTime,
          message: form.message,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerPhoneConfirm: form.customerPhoneConfirm,
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    }
  };

  if (!search.listing) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-xl font-semibold">No listing selected</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse listings and choose one to request a booking or send an enquiry.</p>
        <a href="/search" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
          Browse listings
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-700" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-semibold">Request sent!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The vendor will contact you soon to discuss details. You can track your requests in your dashboard.
        </p>
        <a href="/dashboard/bookings" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
          My requests
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-6 md:pb-12 md:pt-10">
      <h1 className="font-serif text-2xl font-semibold">
        {form.kind === "enquiry" ? "Send an enquiry" : "Request to book"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in a few details and the vendor will reach out to confirm availability and pricing.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Request type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, kind: "booking" }))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${form.kind === "booking" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              Request to Book
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, kind: "enquiry" }))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${form.kind === "enquiry" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              Enquire
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Event date</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              required
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Preferred visit date</label>
            <input
              type="date"
              value={form.visitDate}
              onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Preferred time</label>
            <input
              type="time"
              value={form.visitTime}
              onChange={(e) => setForm((f) => ({ ...f, visitTime: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Your name</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Full name"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Phone number</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Confirm phone number</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              required
              type="tel"
              value={form.customerPhoneConfirm}
              onChange={(e) => setForm((f) => ({ ...f, customerPhoneConfirm: e.target.value }))}
              placeholder="Type phone number again"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Message</label>
          <div className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Tell the vendor about your event, guest count, or any questions..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            I agree that my name and phone number will be shared with the vendor so they can contact me about this request.
          </span>
        </label>

        <Button type="submit" className="w-full rounded-xl">
          {form.kind === "enquiry" ? "Send enquiry" : "Send request"}
        </Button>
      </form>
    </div>
  );
}
