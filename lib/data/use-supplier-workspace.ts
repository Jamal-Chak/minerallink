"use client";

import { useEffect, useState } from "react";

import {
  getSeededSupplierWorkspace,
  readSupplierWorkspace,
  subscribeToSupplierWorkspace,
  type SupplierWorkspace,
} from "@/lib/data/supplier-workspace";

export function useSupplierWorkspace(): { workspace: SupplierWorkspace; ready: boolean } {
  const [workspace, setWorkspace] = useState<SupplierWorkspace>(() => getSeededSupplierWorkspace());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setWorkspace(readSupplierWorkspace());
      setReady(true);
    };
    refresh();
    return subscribeToSupplierWorkspace(refresh);
  }, []);

  return { workspace, ready };
}
