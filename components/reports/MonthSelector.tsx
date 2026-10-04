"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthSelectorProps {
  currentMonth: number; // 1 - 12
  currentYear: number;  // e.g. 2026
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthSelector({ currentMonth, currentYear }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleNavigate = (month: number, year: number) => {
    let newMonth = month;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth.toString());
    params.set("year", newYear.toString());
    router.push(`/reports/monthly?${params.toString()}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (now.getMonth() + 1).toString());
    params.set("year", now.getFullYear().toString());
    router.push(`/reports/monthly?${params.toString()}`);
  };

  const isCurrentMonthActive =
    new Date().getMonth() + 1 === currentMonth &&
    new Date().getFullYear() === currentYear;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Month Navigation Controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <button
          onClick={() => handleNavigate(currentMonth - 1, currentYear)}
          aria-label="Previous Month"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-slate-900 text-base sm:text-lg">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>

        <button
          onClick={() => handleNavigate(currentMonth + 1, currentYear)}
          aria-label="Next Month"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Jump to This Month */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {!isCurrentMonthActive && (
          <button
            onClick={handleCurrentMonth}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors active:scale-95"
          >
            Jump to This Month
          </button>
        )}
      </div>
    </div>
  );
}
