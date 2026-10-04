"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Scissors,
  Eye,
  Calendar,
  User,
  Hash,
  Layers,
  IndianRupee,
} from "lucide-react";
import { formatNumber, formatDate, formatCurrency } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";

interface ColorRowItem {
  id: string;
  colorNameSnapshot: string;
  heads: number;
  piecesPerHead: number;
  givenPieces: number;
  returnedPieces: number;
  damagedPieces: number;
  rate: any;
  amount: any;
}

interface WorkOrderCardProps {
  transaction: {
    id: string;
    designNumberSnapshot: string;
    categorySnapshot: string | null;
    cuttingStyleSnapshot: string | null;
    issueDate: Date | string;
    returnDate: Date | string | null;
    totalGivenPieces: number;
    totalReturnedPieces: number;
    totalDamagedPieces: number;
    totalAmount: any;
    workStatus: "PENDING" | "PARTIALLY_RETURNED" | "COMPLETED" | "CANCELLED";
    paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
    notes: string | null;
    customer: {
      id: string;
      name: string;
      phoneNumber?: string | null;
      address?: string | null;
    };
    colorRows: ColorRowItem[];
  };
}

export function WorkOrderCard({ transaction }: WorkOrderCardProps) {
  const isPending =
    transaction.workStatus === "PENDING" ||
    transaction.workStatus === "PARTIALLY_RETURNED";

  const remainingPieces = Math.max(
    0,
    transaction.totalGivenPieces -
      (transaction.totalReturnedPieces + transaction.totalDamagedPieces)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition-all space-y-3.5">
      {/* Top Header: Worker, Design Badge, Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/customers/${transaction.customer.id}`}
              className="font-bold text-slate-900 text-sm hover:text-blue-600 truncate"
            >
              {transaction.customer.name}
            </Link>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs font-mono">
              <Hash className="w-3 h-3" />
              {transaction.designNumberSnapshot}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
            {transaction.categorySnapshot && (
              <span className="font-semibold text-slate-700">
                {transaction.categorySnapshot}
              </span>
            )}
            {transaction.cuttingStyleSnapshot && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">
                  {transaction.cuttingStyleSnapshot}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              transaction.workStatus === "COMPLETED"
                ? "bg-emerald-100 text-emerald-800"
                : transaction.workStatus === "PARTIALLY_RETURNED"
                ? "bg-amber-100 text-amber-800"
                : transaction.workStatus === "CANCELLED"
                ? "bg-slate-100 text-slate-500"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {transaction.workStatus.replace("_", " ")}
          </span>

          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
              transaction.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : transaction.paymentStatus === "PARTIALLY_PAID"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {transaction.paymentStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Color Rows Snapshot Chips */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        {transaction.colorRows.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
          >
            <span>{r.colorNameSnapshot}</span>
            <strong className="font-mono text-slate-900 font-semibold text-[10px]">
              ({r.givenPieces}p)
            </strong>
          </span>
        ))}
      </div>

      {/* Piece Balances 3-Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center font-mono">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
            Given
          </span>
          <span className="font-extrabold text-slate-800 text-xs">
            {formatNumber(transaction.totalGivenPieces)}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
            Returned
          </span>
          <span className="font-extrabold text-emerald-900 text-xs">
            {formatNumber(transaction.totalReturnedPieces)}
          </span>
        </div>

        <div
          className={`p-2 rounded-xl border ${
            transaction.totalDamagedPieces > 0
              ? "bg-red-50 border-red-100 text-red-900"
              : "bg-slate-50 border-slate-100 text-slate-400"
          }`}
        >
          <span className="text-[10px] font-semibold block uppercase">
            Damaged
          </span>
          <span className="font-extrabold text-xs">
            {formatNumber(transaction.totalDamagedPieces)}
          </span>
        </div>
      </div>

      {/* Date & Value Summary */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Issued: {formatDate(transaction.issueDate)}</span>
        </div>

        <div className="font-mono font-bold text-slate-900 text-xs">
          Order: {formatCurrency(Number(transaction.totalAmount))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isPending ? (
          <Link
            href={`/work/${transaction.id}/return`}
            className="flex-1 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Record Return ({remainingPieces} pcs outside)</span>
          </Link>
        ) : (
          <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
            ✓ Work Fully Completed
          </div>
        )}
      </div>
    </div>
  );
}
