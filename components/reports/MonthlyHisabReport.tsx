"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  IndianRupee,
  Scissors,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronUp,
  User,
  Search,
  X,
  ExternalLink,
  Phone,
} from "lucide-react";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";

export interface MonthlyTransactionItem {
  id: string;
  designNumber: string;
  colorName?: string | null;
  workType: string;
  materialType: string;
  givenPieces: number;
  returnedPieces: number;
  damagedPieces: number;
  headQuantity: number;
  piecesPerHead: number;
  rate: number;
  rateUnit: string;
  startDate: string;
  returnDate: string;
  payableAmount: number;
}

export interface WorkerHisabSummary {
  customerId: string;
  customerName: string;
  phoneNumber?: string | null;
  completedOrdersCount: number;
  totalGivenPieces: number;
  totalReturnedPieces: number;
  totalDamagedPieces: number;
  totalPayableAmount: number;
  items: MonthlyTransactionItem[];
}

interface MonthlyHisabReportProps {
  monthName: string;
  month: number;
  year: number;
  summaries: WorkerHisabSummary[];
}

export function MonthlyHisabReport({
  monthName,
  month,
  year,
  summaries,
}: MonthlyHisabReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Grand Totals Calculation
  const grandTotals = useMemo(() => {
    return summaries.reduce(
      (acc, curr) => ({
        totalPayable: acc.totalPayable + curr.totalPayableAmount,
        totalReturnedPieces: acc.totalReturnedPieces + curr.totalReturnedPieces,
        totalDamagedPieces: acc.totalDamagedPieces + curr.totalDamagedPieces,
        totalOrders: acc.totalOrders + curr.completedOrdersCount,
      }),
      {
        totalPayable: 0,
        totalReturnedPieces: 0,
        totalDamagedPieces: 0,
        totalOrders: 0,
      }
    );
  }, [summaries]);

  // Filtered summaries by worker search
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return summaries;
    const q = searchQuery.toLowerCase().trim();
    return summaries.filter(
      (s) =>
        s.customerName.toLowerCase().includes(q) ||
        (s.phoneNumber && s.phoneNumber.includes(q))
    );
  }, [summaries, searchQuery]);

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Monthly Summary KPI Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
              Monthly Settlement Statement (Hisab)
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              {monthName} {year} Hisab Summary
            </h2>
          </div>

          <button
            onClick={handlePrint}
            className="min-h-[42px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all self-start sm:self-auto print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print Hisab Sheet</span>
          </button>
        </div>

        {/* 4 Grand Totals Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-mono">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              Grand Total Payable
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
              {formatCurrency(grandTotals.totalPayable)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              Good Pieces Completed
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {formatNumber(grandTotals.totalReturnedPieces)}
            </span>
            <span className="text-[10px] text-indigo-300 font-sans">Usable pieces</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              Total Damaged / Scrap
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block">
              {formatNumber(grandTotals.totalDamagedPieces)}
            </span>
            <span className="text-[10px] text-indigo-300 font-sans">Scrap pieces</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              Settled Work Orders
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {formatNumber(grandTotals.totalOrders)}
            </span>
            <span className="text-[10px] text-indigo-300 font-sans">Orders completed</span>
          </div>
        </div>
      </div>

      {/* Search Filter Bar (Hidden on print) */}
      <div className="relative print:hidden">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter hisab by worker name or phone number..."
          className="w-full min-h-[46px] pl-10 pr-10 py-2 rounded-2xl bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm placeholder:text-slate-400 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Monthly Hisab Table View */}
      {filteredSummaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-800">
              No completed work recorded for {monthName} {year}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Work returns completed during this month will automatically appear here with exact rate hisab.
            </p>
          </div>
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
          >
            <span>View Pending Work Orders</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Worker Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4 text-center">Settled Orders</th>
                  <th className="py-3.5 px-4 text-right">Good Pieces</th>
                  <th className="py-3.5 px-4 text-right">Damaged Scrap</th>
                  <th className="py-3.5 px-4 text-right">Net Payable Amount</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((worker) => {
                  const isExpanded = expandedCustomerId === worker.customerId;

                  return (
                    <tr
                      key={worker.customerId}
                      className="hover:bg-slate-50/80 transition-colors font-medium text-slate-700"
                    >
                      {/* Worker Name */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/customers/${worker.customerId}`}
                          className="font-bold text-slate-900 hover:text-blue-600 text-sm"
                        >
                          {worker.customerName}
                        </Link>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {worker.phoneNumber ? (
                          <a
                            href={`tel:${worker.phoneNumber}`}
                            className="hover:underline text-blue-600 font-semibold"
                          >
                            {worker.phoneNumber}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Completed Orders Count */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {worker.completedOrdersCount} orders
                        </span>
                      </td>

                      {/* Good Pieces */}
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 text-sm">
                        {formatNumber(worker.totalReturnedPieces)} pcs
                      </td>

                      {/* Damaged Pieces */}
                      <td className="py-3 px-4 text-right font-mono text-amber-800 font-semibold">
                        {worker.totalDamagedPieces > 0 ? (
                          <span>{formatNumber(worker.totalDamagedPieces)} pcs</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>

                      {/* Total Payable Amount */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(worker.totalPayableAmount)}
                      </td>

                      {/* Drilldown Toggle */}
                      <td className="py-3 px-4 text-center print:hidden">
                        <button
                          onClick={() => toggleExpand(worker.customerId)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all ${
                            isExpanded
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{isExpanded ? "Hide" : "View Jobs"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer with Grand Totals */}
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <td className="py-3 px-4" colSpan={2}>
                    GRAND TOTAL ({filteredSummaries.length} Workers)
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {grandTotals.totalOrders} orders
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-900 font-black">
                    {formatNumber(grandTotals.totalReturnedPieces)} pcs
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-900">
                    {formatNumber(grandTotals.totalDamagedPieces)} pcs
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    {formatCurrency(grandTotals.totalPayable)}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Drilldown Itemized Section if Expanded */}
          {expandedCustomerId && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2">
              {(() => {
                const worker = summaries.find((s) => s.customerId === expandedCustomerId);
                if (!worker) return null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Itemized Completed Jobs for {worker.customerName} ({worker.items.length} orders)
                      </h4>
                      <Link
                        href={`/customers/${worker.customerId}`}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Worker Ledger Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                            <th className="py-2.5 px-3">Design #</th>
                            <th className="py-2.5 px-3">Color</th>
                            <th className="py-2.5 px-3">Cutting Type</th>
                            <th className="py-2.5 px-3">Returned Date</th>
                            <th className="py-2.5 px-3 text-right">Good Pieces</th>
                            <th className="py-2.5 px-3 text-right">Damaged</th>
                            <th className="py-2.5 px-3 text-right">Rate Applied</th>
                            <th className="py-2.5 px-3 text-right">Payable (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {worker.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80">
                              <td className="py-2 px-3 font-bold text-slate-900 font-sans">
                                {item.designNumber}
                              </td>
                              <td className="py-2 px-3 font-sans">
                                {item.colorName ? (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {item.colorName}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-600">
                                {item.workType} Cutting
                              </td>
                              <td className="py-2 px-3 text-slate-500">
                                {formatDate(item.returnDate)}
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                                {formatNumber(item.returnedPieces)}
                              </td>
                              <td className="py-2 px-3 text-right text-amber-700">
                                {item.damagedPieces}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600">
                                ₹{item.rate.toFixed(2)}/{item.rateUnit === "PER_HEAD" ? "head" : "pc"}
                              </td>
                              <td className="py-2 px-3 text-right font-black text-slate-900 font-sans">
                                {formatCurrency(item.payableAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
