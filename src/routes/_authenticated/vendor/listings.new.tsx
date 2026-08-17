import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getVendorFormOptions } from "@/lib/vendor.functions";
import { createListing } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/listings/new")({
  component: NewListing,
  head: () => ({
    meta: [
      { title: "Add a listing | Celebratz" },
      { name: "description", content: "Create a new venue or service listing on Celebratz." },
      { property: "og:title", content: "Add a listing | Celebratz" },
      { property: "og:description", content: "Create a new venue or service listing on Celebratz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PRICE_UNITS = [
  { value: "per_day", label: "per day" },
  { value: "per_plate", label: "per plate" },
  { value: "per_event", label: "per event" },
  { value: "per_hour", label: "per hour" },
];

function NewListing() {
  const navigate = useNavigate();
  const fetchOptions = useServerFn(getVendorFormOptions);
  const create = useServerFn(createListing);
  const { data: options, isLoading } = useQuery({ queryKey: ["vendor-form-options"], queryFn: () => fetchOptions() });

  const [form, setForm] = useState({
    title: "",
    category_id: "",
    area_id: "",
    description: "",
    price_from: "",
    price_unit: "per_event",
    address: "",
  });
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [eventTypeIds, setEventTypeIds] = useState<string[]>([]);

  const categoryFields = useMemo(
    () => (options?.fields ?? []).filter((f: any) => f.category_id === form.category_id),
    [options, form.category_id],
  );

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          title: form.title,
          category_id: form.category_id,
          area_id: form.area_id,
          description: form.description,
          price_from: form.price_from,
          price_unit: form.price_unit as any,
          address: form.address || undefined,
          attributes,
          event_type_ids: eventTypeIds,
        },
      }),
    onSuccess: () => {
      toast.success("Listing submitted for review");
      navigate({ to: "/vendor" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create listing"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24 md:py-12">
      <h1 className="font-serif text-2xl font-semibold">Add a listing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a category and the form adapts to the details couples and planners look for.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!eventTypeIds.length) {
            toast.error("Select at least one event type");
            return;
          }
          mutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            required
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.category_id}
            onChange={(e) => {
              setForm({ ...form, category_id: e.target.value });
              setAttributes({});
            }}
          >
            <option value="">Select a category</option>
            {(options?.categories ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="title">Listing title</Label>
          <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <Label htmlFor="area">Area in Pune</Label>
          <select
            id="area"
            required
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.area_id}
            onChange={(e) => setForm({ ...form, area_id: e.target.value })}
          >
            <option value="">Select an area</option>
            {(options?.areas ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Starting price (₹)</Label>
            <Input
              id="price"
              required
              inputMode="numeric"
              value={form.price_from}
              onChange={(e) => setForm({ ...form, price_from: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unit">Price unit</Label>
            <select
              id="unit"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.price_unit}
              onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <Label>Event types</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {(options?.eventTypes ?? []).map((et: any) => (
              <label key={et.id} className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm">
                <Checkbox
                  checked={eventTypeIds.includes(et.id)}
                  onCheckedChange={(checked) =>
                    setEventTypeIds((prev) => (checked ? [...prev, et.id] : prev.filter((id) => id !== et.id)))
                  }
                />
                {et.name}
              </label>
            ))}
          </div>
        </div>

        {categoryFields.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <h2 className="font-serif text-lg font-semibold">Category details</h2>
            <div className="mt-4 space-y-4">
              {categoryFields.map((field: any) => (
                <CategoryField
                  key={field.id}
                  field={field}
                  value={attributes[field.key]}
                  onChange={(value) => setAttributes((prev) => ({ ...prev, [field.key]: value }))}
                />
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for review
        </Button>
      </form>
    </div>
  );
}

function CategoryField({
  field,
  value,
  onChange,
}: {
  field: any;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const options: string[] = Array.isArray(field.options) ? field.options : [];
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;

  if (field.field_type === "bool") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => onChange(Boolean(checked))} />
        {label}
      </label>
    );
  }

  if (field.field_type === "enum") {
    return (
      <div>
        <Label>{label}</Label>
        <select
          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.field_type === "multi") {
    const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <Label>{label}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-1.5 text-sm">
              <Checkbox
                checked={selected.includes(o)}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...selected, o] : selected.filter((s) => s !== o))
                }
              />
              {o}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Input
        inputMode={field.field_type === "number" ? "numeric" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(field.field_type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}
