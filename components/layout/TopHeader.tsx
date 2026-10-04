"use client";

import { Search, Bell } from "lucide-react";

export function TopHeader() {
  return (
    <header className="hidden md:flex items-center justify-end px-8 py-4 bg-transparent shrink-0">
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl bg-slate-100/80 hover:bg-slate-100 border-none text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
          A
        </div>
      </div>
    </header>
  );
}
