"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Scissors,
  CheckCircle2,
  Clock,
  IndianRupee,
  Calendar,
  Layers,
  Hash,
  AlertCircle,
  CreditCard,
  History,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";

interface WorkerProfileViewProps {
  customer: {
    id: string;
    name: string;
    phoneNumber: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date | string;
    transactions: Array<{
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
      colorRows: Array<{
        id: string;
        colorNameSnapshot: string;
        heads: number;
        piecesPerHead: number;
        givenPieces: number;
        returnedPieces: number;
        damagedPieces: number;
        rate: any;
        amount: any;
      }>;
    }>;
    payments: Array<{
      id: string;
      fromDate: Date | string;
      toDate: Date | string;
      paymentDate: Date | string;
      paymentAmount: any;
      notes: string | null;
      allocations: Array<{
        id: string;
        allocatedAmount: any;
        workTransaction: {
          id: string;
          designNumberSnapshot: string;
          categorySnapshot: string | null;
          issueDate: Date | string;
        };
      }>;
    }>;
  };
}

export function WorkerProfileView({ customer }: WorkerProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"active" | "history" | "payments">("active");

  // Filter transactions
  const activeTransactions = customer.transactions.filter(
    (tx) => tx.workStatus === "PENDING" || tx.workStatus === "PARTIALLY_RETURNED"
  );
  const completedTransactions = customer.transactions.filter(
    (tx) => tx.workStatus === "COMPLETED" || tx.workStatus === "CANCELLED"
  );

  // Financial Metrics
  const totalPayable = customer.transactions.reduce(
    (sum, tx) => sum + Number(tx.totalAmount),
    0
  );
  const totalPaid = customer.payments.reduce(
    (sum, p) => sum + Number(p.paymentAmount),
    0
  );
  const outstandingBalance = totalPayable - totalPaid;

  const outsidePieces = activeTransactions.reduce(
    (sum, tx) => sum + (tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces)),
    0
  );
  const completedPieces = customer.transactions.reduce(
    (sum, tx) => sum + tx.totalReturnedPieces,
    0
  );
  const damagedPieces = customer.transactions.reduce(
    (sum, tx) => sum + tx.totalDamagedPieces,
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {customer.name}
              </h1>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  customer.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {customer.isActive ? "Active Worker" : "Archived"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Worker Profile & Financial Settlement Ledger
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>

          <Link
            href={`/payments/new?customerId=${customer.id}`}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Pay Worker</span>
          </Link>

          {customer.isActive && (
            <Link
              href={`/work/new?customerId=${customer.id}`}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Issue Work</span>
            </Link>
          )}
        </div>
      </div>

      {/* Worker Information & Contact Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            {customer.address && (
              <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{customer.address}</span>
              </p>
            )}
            {customer.notes && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 italic">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{customer.notes}</span>
              </p>
            )}
          </div>

          {customer.phoneNumber && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <a
                href={`tel:${customer.phoneNumber}`}
                className="min-h-[42px] px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors font-mono"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{customer.phoneNumber}</span>
              </a>
              <a
                href={`https://wa.me/91${customer.phoneNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] px-3 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                title="Open WhatsApp"
              >
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* 5-KPI Financial & Work Ledger Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Pieces Outside
            </p>
            <p className="text-lg font-black text-amber-900 mt-0.5 font-mono">
              {formatNumber(outsidePieces)}{" "}
              <span className="text-xs font-normal text-amber-700">pcs</span>
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              {activeTransactions.length} active order(s)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Completed Pieces
            </p>
            <p className="text-lg font-black text-emerald-900 mt-0.5 font-mono">
              {formatNumber(completedPieces)}{" "}
              <span className="text-xs font-normal text-emerald-700">pcs</span>
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              {damagedPieces > 0 ? `${damagedPieces} damaged` : "0 damaged"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Total Work Payable
            </p>
            <p className="text-lg font-black text-blue-900 mt-0.5 font-mono">
              {formatCurrency(totalPayable)}
            </p>
            <p className="text-[10px] text-blue-600 mt-0.5">
              {customer.transactions.length} total orders
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/60">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
              Total Cash Paid
            </p>
            <p className="text-lg font-black text-purple-900 mt-0.5 font-mono">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-[10px] text-purple-600 mt-0.5">
              {customer.payments.length} disbursements
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${
              outstandingBalance > 0
                ? "bg-red-50/80 border-red-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                outstandingBalance > 0 ? "text-red-700" : "text-slate-600"
              }`}
            >
              Net Balance Due
            </p>
            <p
              className={`text-lg font-black mt-0.5 font-mono ${
                outstandingBalance > 0 ? "text-red-900" : "text-slate-900"
              }`}
            >
              {formatCurrency(outstandingBalance)}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${
                outstandingBalance > 0
                  ? "text-red-600 font-bold"
                  : "text-slate-400"
              }`}
            >
              {outstandingBalance > 0 ? "Pending Settlement" : "Fully Settled"}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Tab Navigation: Active Work | Work History | Payment History */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          onClick={() => setActiveTab("active")}
          className={`min-h-[46px] px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "active"
              ? "bg-white text-amber-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Work ({activeTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`min-h-[46px] px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "history"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>All Work Orders ({customer.transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`min-h-[46px] px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "payments"
              ? "bg-white text-emerald-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Payment History ({customer.payments.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. ACTIVE WORK ORDERS TAB */}
      {/* ========================================================= */}
      {activeTab === "active" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Active & Pending Work Orders ({activeTransactions.length})
              </h3>
            </div>
            {outsidePieces > 0 && (
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-mono">
                {formatNumber(outsidePieces)} pcs outside
              </span>
            )}
          </div>

          {activeTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">All Work Accounted For</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                This worker currently has no active pieces pending return outside.
              </p>
              {customer.isActive && (
                <Link
                  href={`/work/new?customerId=${customer.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Issue New Work</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeTransactions.map((tx) => {
                const remaining =
                  tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces);

                return (
                  <div key={tx.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-black text-sm tracking-wide font-mono">
                          <Hash className="w-3.5 h-3.5" />
                          {tx.designNumberSnapshot}
                        </span>

                        {tx.categorySnapshot && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold">
                            {tx.categorySnapshot}
                          </span>
                        )}

                        {tx.cuttingStyleSnapshot && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                            {tx.cuttingStyleSnapshot}
                          </span>
                        )}

                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Issued: {formatDate(tx.issueDate)}
                        </span>
                      </div>

                      {/* 1-Click Return Button */}
                      <Link
                        href={`/work/${tx.id}/return`}
                        className="min-h-[38px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all self-start sm:self-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Record Return (Lenvanu)</span>
                      </Link>
                    </div>

                    {/* Color-wise Rows breakdown */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Color Variations & Calculation Rows:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {tx.colorRows.map((row) => {
                          const swatch = getColorSwatch(row.colorNameSnapshot);
                          const rowRemaining =
                            row.givenPieces - (row.returnedPieces + row.damagedPieces);

                          return (
                            <div
                              key={row.id}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border shrink-0"
                                  style={{
                                    backgroundColor: swatch.bg,
                                    borderColor: swatch.border,
                                  }}
                                />
                                <div className="truncate">
                                  <p className="font-bold text-slate-900 truncate">
                                    {row.colorNameSnapshot}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    {row.heads} heads × {row.piecesPerHead} ={" "}
                                    <strong>{row.givenPieces} pcs</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="font-mono font-bold text-amber-700">
                                  {rowRemaining} outside
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  @ ₹{Number(row.rate).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-semibold text-amber-800">
                        Remaining outside: <strong className="font-mono">{formatNumber(remaining)} pcs</strong>{" "}
                        (Returned: {tx.totalReturnedPieces}, Damaged: {tx.totalDamagedPieces})
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        Order Value: {formatCurrency(Number(tx.totalAmount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ALL WORK ORDERS HISTORY TAB */}
      {/* ========================================================= */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Complete Work History Ledger ({customer.transactions.length})
              </h3>
            </div>
          </div>

          {customer.transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xs font-semibold text-slate-600">No work orders recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customer.transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-black text-xs font-mono">
                        <Hash className="w-3 h-3" />
                        {tx.designNumberSnapshot}
                      </span>
                      {tx.categorySnapshot && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                          {tx.categorySnapshot}
                        </span>
                      )}
                      {tx.cuttingStyleSnapshot && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                          {tx.cuttingStyleSnapshot}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Issued: {formatDate(tx.issueDate)}
                        {tx.returnDate && ` • Returned: ${formatDate(tx.returnDate)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.workStatus === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : tx.workStatus === "PARTIALLY_RETURNED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {tx.workStatus.replace("_", " ")}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {tx.paymentStatus.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600">
                      Given: <strong className="text-slate-900">{formatNumber(tx.totalGivenPieces)} pcs</strong> •{" "}
                      Returned: <strong className="text-emerald-700">{formatNumber(tx.totalReturnedPieces)} pcs</strong>
                      {tx.totalDamagedPieces > 0 && (
                        <span className="text-red-500 ml-1">
                          ({tx.totalDamagedPieces} damaged)
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {formatCurrency(Number(tx.totalAmount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PAYMENT SETTLEMENT HISTORY TAB */}
      {/* ========================================================= */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Cash Payment Settlements ({customer.payments.length})
              </h3>
            </div>

            <Link
              href={`/payments/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Link>
          </div>

          {customer.payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No Payments Recorded</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Cash payments disbursed to this worker will appear here with issue date ranges.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customer.payments.map((p) => (
                <div key={p.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Payment #{p.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Paid on {formatDate(p.paymentDate)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Disbursement Period:{" "}
                        <strong className="text-slate-800 font-mono">
                          {formatDate(p.fromDate)} &rarr; {formatDate(p.toDate)}
                        </strong>
                      </p>
                      {p.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Note: {p.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-emerald-700 font-mono">
                        {formatCurrency(Number(p.paymentAmount))}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">✓ Cash Disbursed</p>
                    </div>
                  </div>

                  {/* Payment Allocations preview if any */}
                  {p.allocations && p.allocations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Settled orders:</span>
                      {p.allocations.map((a) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium"
                        >
                          #{a.workTransaction.designNumberSnapshot} ({formatCurrency(Number(a.allocatedAmount))})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
