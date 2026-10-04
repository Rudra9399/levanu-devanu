"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scissors, IndianRupee, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
    activeMatch: (pathname: string) => pathname === "/",
  },
  {
    label: "Work",
    href: "/work",
    icon: Scissors,
    activeMatch: (pathname: string) => pathname.startsWith("/work"),
  },
  {
    label: "Payment",
    href: "/payments",
    icon: IndianRupee,
    activeMatch: (pathname: string) => pathname.startsWith("/payments"),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    activeMatch: (pathname: string) => pathname.startsWith("/reports"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 md:hidden safe-area-pb"
    >
      <div className="grid grid-cols-4 items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.activeMatch(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl transition-all select-none active:scale-95",
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
              </div>
              <span className="text-[11px] leading-tight tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
