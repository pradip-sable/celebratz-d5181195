import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyVendor, getVendorFormOptions, upsertVendorProfile } from "@/lib/vendor.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/profile")({
  component: VendorProfile,
  head: () => ({
    meta: [
      { title: "Business profile | Celebratz" },
      { name: "description", content: "Update your Celebratz business name, contact details and service area." },
      { property: "og:title", content: "Business profile | Celebratz" },
      { property: "og:description", content: "Update your Celebratz business name, contact details and service area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VendorProfile() {
  const navigate = useNavigate();
  const fetchVendor = useServerFn(getMyVendor);
  const fetchOptions = useServerFn(getVendorFormOptions);
  const save = useServerFn(upsertVendorProfile);

  const { data: vendor, isLoading } = useQuery({ queryKey: ["my-vendor"], queryFn: () => fetchVendor() });
  const { data: options } = useQuery({ queryKey: ["vendor-form-options"], queryFn: () => fetchOptions() });

  const [form, setForm] = useState({
    business_name: "",
    about: "",
    contact_phone: "",
    contact_email: "",
    area_id: "",
    address: "",
  });

  useEffect(() => {
    if (!vendor) return;
    setForm({
      business_name: vendor.business_name ?? "",
      about: vendor.about ?? "",
      contact_phone: vendor.contact_phone ?? "",
      contact_email: vendor.contact_email ?? "",
      area_id: vendor.area_id ?? "",
      address: vendor.address ?? "",
    });
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          business_name: form.business_name,
          about: form.about || undefined,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email || "",
          area_id: form.area_id || undefined,
          address: form.address || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Business profile saved");
      navigate({ to: "/vendor" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save profile"),
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
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold">Business profile</h1>
        {vendor?.status && <Badge variant={vendor.status === "approved" ? "default" : "secondary"}>{vendor.status}</Badge>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        These details are shown to customers and used when we share leads with you.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="business_name">Business name</Label>
          <Input
            id="business_name"
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="about">About your business</Label>
          <Textarea
            id="about"
            rows={4}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact_phone">Contact phone</Label>
            <Input
              id="contact_phone"
              required
              inputMode="tel"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="area">Primary area</Label>
          <select
            id="area"
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
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save business profile
        </Button>
      </form>
    </div>
  );
}
