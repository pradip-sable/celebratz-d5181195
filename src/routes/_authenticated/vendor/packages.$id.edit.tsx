import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyPackages, getPackageForEdit, updatePackage } from "@/lib/packages.functions";
import { PackageForm } from "@/components/PackageForm";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/packages/$id/edit")({
  component: EditPackageRoute,
  head: () => ({
    meta: [
      { title: "Edit Package | Celebratz" },
      { name: "description", content: "Update your multi-service celebration package." },
      { property: "og:title", content: "Edit Package | Celebratz" },
      { property: "og:description", content: "Update your multi-service celebration package." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function EditPackageRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchMyPackages = useServerFn(getMyPackages);
  const fetchPackageForEdit = useServerFn(getPackageForEdit);
  const savePackage = useServerFn(updatePackage);

  const { data: myPackagesData, isLoading: isPackagesLoading } = useQuery({
    queryKey: ["vendor-packages"],
    queryFn: () => fetchMyPackages(),
  });

  const { data: pkg, isLoading: isPkgLoading } = useQuery({
    queryKey: ["package-edit", id],
    queryFn: () => fetchPackageForEdit({ data: { packageId: id } }),
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
          packageId: id,
          name: values.name,
          description: values.description || undefined,
          cover_image: values.cover_image || undefined,
          discount_type: values.discount_type,
          discount_value: values.discount_value,
          listing_ids: values.listing_ids,
        },
      }),
    onSuccess: () => {
      toast.success("Package updated and submitted for review!");
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
      queryClient.invalidateQueries({ queryKey: ["package-edit", id] });
      navigate({ to: "/vendor/packages" });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Could not update package");
    },
  });

  if (isPackagesLoading || isPkgLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-xl font-semibold">Package not found</h1>
      </div>
    );
  }

  const matchingPackage = (myPackagesData?.packages ?? []).find((p: any) => p.id === id);

  const initialValues = {
    name: pkg.name,
    description: pkg.description ?? "",
    cover_image: pkg.cover_image ?? "",
    discount_type: pkg.discount_type as "percentage" | "fixed_amount",
    discount_value: Number(pkg.discount_value),
    listing_ids: (pkg.package_listings ?? []).map((pl: any) => pl.listing_id),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-12">
      <PackageForm
        isEdit
        liveListings={myPackagesData?.liveListings ?? []}
        initialValues={initialValues}
        currentStatus={pkg.status}
        rejectionReason={matchingPackage?.rejection_reason}
        isSubmitting={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
