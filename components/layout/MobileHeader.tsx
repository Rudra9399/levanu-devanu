"use client";

import Link from "next/link";
import { Plus, Palette, Database } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 md:hidden flex items-center justify-between shadow-xs">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          DL
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-sm leading-tight">
            Devanu-Lenvanu
          </h1>
          <p className="text-[10px] text-slate-500 font-medium leading-none">
            Work & Hisab Register
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/masters"
          aria-label="System Masters"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 active:bg-slate-100 transition-colors"
          title="Masters"
        >
          <Database className="w-4 h-4" />
        </Link>
        <Link
          href="/designs"
          aria-label="Designs Catalog"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 active:bg-slate-100 transition-colors"
          title="Designs"
        >
          <Palette className="w-4 h-4" />
        </Link>
        <Link
          href="/work/new"
          className="min-h-[40px] px-3 flex items-center gap-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs active:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Work</span>
        </Link>
      </div>
    </header>
  );
}
