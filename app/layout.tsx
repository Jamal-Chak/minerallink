import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthenticatedShell } from "@/components/auth/authenticated-shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MineralLink | Mineral Supplier Intelligence",
  description: "Mineral supplier intelligence and deal management dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        <AuthProvider>
          <AuthenticatedShell>{children}</AuthenticatedShell>
        </AuthProvider>
      </body>
    </html>
  );
}
