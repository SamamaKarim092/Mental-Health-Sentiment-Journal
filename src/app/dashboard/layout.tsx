"use client";

import { useState } from "react";
import Sidebar from "@/app/components/dashboard/Sidebar";
import Header from "@/app/components/dashboard/Header";
import { MoodProvider } from "@/app/context/MoodContext";
import AmbientBackground from "@/app/components/ui/AmbientBackground";
import OtpModal from "@/app/components/auth/OtpModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MoodProvider>
      <OtpModal />
      <div className="flex min-h-screen relative">
        <AmbientBackground />
        <Sidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </MoodProvider>
  );
}
