import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devanu-Lenvanu — Work & Piece Ledger",
  description: "Internal record-keeping register for cutting pieces, returns and hisab calculation",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row bg-[#f8fafc] text-slate-900">
        {/* Desktop Sidebar (visible on md: and above) */}
        <DesktopSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {/* Mobile Top Header (visible on mobile only) */}
          <MobileHeader />

          {/* Page Body Container */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Fixed Bottom Navigation (visible on mobile only) */}
        <BottomNav />

        {/* Toaster for Mobile-friendly Toast alerts */}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

