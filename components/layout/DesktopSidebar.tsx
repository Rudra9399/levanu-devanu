"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Users,
  IndianRupee,
  Hash,
  BarChart3,
  Plus,
  Palette,
  Layers,
  Scissors,
  ChevronRight,
  GitPullRequest,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

const SIDEBAR_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    activeMatch: (pathname: string) => pathname === "/",
  },
  {
    label: "Work Orders",
    href: "/work",
    icon: GitPullRequest,
    activeMatch: (pathname: string) => pathname.startsWith("/work"),
  },
  {
    label: "Worker Payments",
    href: "/payments",
    icon: IndianRupee,
    activeMatch: (pathname: string) => pathname.startsWith("/payments"),
  },
  {
    label: "Workers",
    href: "/workers",
    icon: Users,
    activeMatch: (pathname: string) =>
      pathname.startsWith("/workers") || pathname.startsWith("/customers"),
  },
  {
    label: "Designs",
    href: "/design-numbers",
    icon: Hash,
    activeMatch: (pathname: string) => pathname.startsWith("/design-numbers"),
  },
  {
    label: "Colors",
    href: "/masters?tab=colors",
    icon: Palette,
    activeMatch: (pathname: string, search: string) =>
      pathname.startsWith("/masters") && (search.includes("tab=colors") || !search),
  },
  {
    label: "Materials",
    href: "/masters?tab=categories",
    icon: Layers,
    activeMatch: (pathname: string, search: string) =>
      pathname.startsWith("/masters") && search.includes("tab=categories"),
  },
  {
    label: "Cutting Types",
    href: "/masters?tab=cutting",
    icon: Scissors,
    activeMatch: (pathname: string, search: string) =>
      pathname.startsWith("/masters") && search.includes("tab=cutting"),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    activeMatch: (pathname: string) => pathname.startsWith("/reports"),
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() || "";

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen shrink-0 shadow-2xs">
      {/* Brand Header */}
      <div className="p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20">
            DL
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
              Devanu - Lenvanu
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Piece & Work Register
            </p>
          </div>
        </Link>
      </div>

      {/* Primary Quick Action Button */}
      <div className="px-4 pb-4">
        <Link
          href="/work/new"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Issue New Work</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.activeMatch(pathname, searchString);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all",
                isActive
                  ? "bg-blue-50/80 text-blue-600 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Install Desktop App Card */}
      <InstallAppButton className="border-t border-slate-100" />

      {/* Bottom User Profile */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <p className="font-bold text-xs text-slate-800 leading-tight">Admin</p>
              <p className="text-[11px] text-slate-400 font-medium">Administrator</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </aside>
  );
}

