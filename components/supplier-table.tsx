"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { useSupplierWorkspace } from "@/lib/data/use-supplier-workspace";

const commodityOptions = ["ALL", "COPPER", "LEAD", "ZINC", "NICKEL"] as const;
const quantityFormatter = new Intl.NumberFormat("en-US");

export function SupplierTable() {
  const { workspace } = useSupplierWorkspace();
  const [query, setQuery] = useState("");
  const [commodity, setCommodity] = useState<(typeof commodityOptions)[number]>("ALL");
  const [country, setCountry] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [pipeline, setPipeline] = useState("ALL");

  const countries = ["ALL", ...new Set(workspace.suppliers.map((supplier) => supplier.country))];
  const verificationValues = [
    "ALL",
    "VERIFIED",
    "UNDER_REVIEW",
    "UNVERIFIED",
    "REJECTED",
  ];
  const pipelineValues = [
    "ALL",
    "NEW",
    "CONTACTED",
    "RESPONDED",
    "DOCUMENTS_REQUESTED",
    "UNDER_VERIFICATION",
    "QUALIFIED",
    "REJECTED",
  ];

  const filteredSuppliers = useMemo(() => {
    return workspace.suppliers.filter((supplier) => {
      const product = workspace.products[supplier.id]?.[0];
      const search = query.trim().toLowerCase();
      const matchesQuery =
        search.length === 0 ||
        supplier.companyName.toLowerCase().includes(search) ||
        supplier.country.toLowerCase().includes(search) ||
        product?.name.toLowerCase().includes(search) ||
        supplier.mineOrProjectName?.toLowerCase().includes(search);

      const matchesCommodity =
        commodity === "ALL" || product?.specification.commodity === commodity;
      const matchesCountry = country === "ALL" || supplier.country === country;
      const matchesVerification =
        verification === "ALL" || supplier.verificationStatus === verification;
      const matchesPipeline =
        pipeline === "ALL" || supplier.pipelineStatus === pipeline;

      return (
        matchesQuery &&
        matchesCommodity &&
        matchesCountry &&
        matchesVerification &&
        matchesPipeline
      );
    });
  }, [commodity, country, pipeline, query, verification, workspace.products, workspace.suppliers]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="block text-sm text-slate-600">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Supplier or project"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-300 focus:bg-white"
          />
        </label>

        <label className="block text-sm text-slate-600">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Commodity
          </span>
          <select
            value={commodity}
            onChange={(event) => setCommodity(event.target.value as (typeof commodityOptions)[number])}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {commodityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-600">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Country
          </span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {countries.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All countries" : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-600">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Verification
          </span>
          <select
            value={verification}
            onChange={(event) => setVerification(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {verificationValues.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-600">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Pipeline
          </span>
          <select
            value={pipeline}
            onChange={(event) => setPipeline(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
          >
            {pipelineValues.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All stages" : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
            <thead className="bg-slate-50 uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Mineral</th>
                <th className="px-4 py-3 font-medium">Production</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Pipeline</th>
                <th className="px-4 py-3 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSuppliers.map((supplier) => {
                const product = workspace.products[supplier.id]?.[0];
                const monthlyCapacity = product?.monthlyCapacityMt ?? 0;
                return (
                  <tr key={supplier.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/suppliers/${supplier.id}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                          {supplier.companyName}
                        </Link>
                        {workspace.metadata[supplier.id]?.isDemoFixture && <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Synthetic demo fixture</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{supplier.country}</td>
                    <td className="px-4 py-3 capitalize">{supplier.supplierType.toLowerCase()}</td>
                    <td className="px-4 py-3">{product?.specification.commodity ?? "—"}</td>
                    <td className="px-4 py-3">{supplier.productionStatus}</td>
                    <td className="px-4 py-3">{quantityFormatter.format(monthlyCapacity)} MT</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={supplier.verificationStatus.replace("_", " ")} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={supplier.pipelineStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">Today</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {filteredSuppliers.map((supplier) => {
            const product = workspace.products[supplier.id]?.[0];
            const monthlyCapacity = product?.monthlyCapacityMt ?? 0;
            return (
              <Link
                key={supplier.id}
                href={`/suppliers/${supplier.id}`}
                className="block rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{supplier.companyName}</div>
                    <div className="mt-1 text-xs text-slate-500">{supplier.country}</div>
                    {workspace.metadata[supplier.id]?.isDemoFixture && <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Synthetic demo fixture</div>}
                  </div>
                  <StatusBadge label={supplier.verificationStatus.replace("_", " ")} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>{product?.specification.commodity ?? ""}</span>
                  <span>{quantityFormatter.format(monthlyCapacity)} MT</span>
                </div>
                <div className="mt-2">
                  <StatusBadge label={supplier.pipelineStatus} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
