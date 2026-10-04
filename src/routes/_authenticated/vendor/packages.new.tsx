import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyPackages, createPackage } from "@/lib/packages.functions";
import { PackageForm } from "@/components/PackageForm";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/packages/new")({
  component: NewPackageRoute,
  head: () => ({
    meta: [
      { title: "Create Package | Celebratz" },
      { name: "description", content: "Bundle your celebration services into an attractive multi-service package." },
      { property: "og:title", content: "Create Package | Celebratz" },
      { property: "og:description", content: "Bundle your celebration services into an attractive multi-service package." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NewPackageRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchMyPackages = useServerFn(getMyPackages);
  const savePackage = useServerFn(createPackage);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-packages"],
    queryFn: () => fetchMyPackages(),
  });

  const mutation = useMutation({
    mutationFn: (values: {
      name: string;
      description: string;
      cover_image: string;
      discount_type: "percentage" | "fixed_amount";
      discount_value: number;
      listing_ids: string[];
    }) =>
      savePackage({
        data: {
          name: values.name,
          description: values.description || undefined,
          cover_image: values.cover_image || undefined,
          discount_type: values.discount_type,
          discount_value: values.discount_value,
          listing_ids: values.listing_ids,
          submit: true,
        },
      }),
    onSuccess: () => {
      toast.success("Package created and submitted for review!");
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
      navigate({ to: "/vendor/packages" });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Could not create package");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
      <PackageForm
        liveListings={data?.liveListings ?? []}
        isSubmitting={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
