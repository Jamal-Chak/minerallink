import { SupplierDetailWorkspace } from "@/components/supplier-workflow/supplier-detail-workspace";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierDetailWorkspace supplierId={id} />;
}
