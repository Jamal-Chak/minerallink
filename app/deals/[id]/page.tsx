import { DealWorkspace } from "@/components/deals/deal-workspace";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealWorkspace dealId={id} />;
}
