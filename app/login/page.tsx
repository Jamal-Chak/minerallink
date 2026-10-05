import { Suspense } from "react";

import { LoginPanel } from "@/components/auth/login-panel";

function LoginPanelFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <p className="text-sm text-slate-600">Loading sign in…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPanelFallback />}>
      <LoginPanel />
    </Suspense>
  );
}
