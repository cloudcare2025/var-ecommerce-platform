"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useSidebarStore } from "@/lib/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-admin-bg">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        }`}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
