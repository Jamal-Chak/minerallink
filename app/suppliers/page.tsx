import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SupplierTable } from "@/components/supplier-table";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Supplier database</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Suppliers</h1>
        </div>
        <Button className="w-fit" nativeButton={false} render={<Link href="/suppliers/new" />}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <SupplierTable />
    </div>
  );
}
