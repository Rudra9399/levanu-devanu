"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Scissors,
  ArrowLeft,
  User,
  Hash,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  Sparkles,
  Layers,
  RotateCcw,
  Check,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";
import { recordColorReturnAction } from "@/lib/actions/transaction-actions";

interface ColorRowData {
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

interface ReturnWorkFormProps {
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
    workStatus: string;
    notes: string | null;
    customer: {
      id: string;
      name: string;
      phoneNumber: string | null;
      address: string | null;
    };
    colorRows: ColorRowData[];
  };
}

export function ReturnWorkForm({ transaction }: ReturnWorkFormProps) {
  const router = useRouter();

  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(transaction.notes || "");
  const [loading, setLoading] = useState(false);

  // Per-color row inputs state
  const [rowsState, setRowsState] = useState(() =>
    transaction.colorRows.map((r) => {
      // By default if unreturned, prefill with givenPieces - damagedPieces
      const alreadyAccounted = r.returnedPieces + r.damagedPieces;
      const remaining = r.givenPieces - alreadyAccounted;

      return {
        id: r.id,
        colorName: r.colorNameSnapshot,
        givenPieces: r.givenPieces,
        returnedPieces: r.returnedPieces > 0 ? r.returnedPieces : r.givenPieces,
        damagedPieces: r.damagedPieces || 0,
        rate: Number(r.rate),
      };
    })
  );

  // Handle row input change
  const handleRowChange = (
    rowId: string,
    field: "returnedPieces" | "damagedPieces",
    val: number | ""
  ) => {
    const num = val === "" ? 0 : Number(val);
    setRowsState((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return { ...r, [field]: num };
      })
    );
  };

  // Shortcut: Fill all remaining as returned (0 damaged)
  const handleFillAllRemaining = () => {
    setRowsState((prev) =>
      prev.map((r) => ({
        ...r,
        returnedPieces: r.givenPieces,
        damagedPieces: 0,
      }))
    );
    toast.success("Filled all pieces as fully returned.");
  };

  // Totals calculations
  const totals = useMemo(() => {
    let totalGiven = 0;
    let totalReturned = 0;
    let totalDamaged = 0;

    rowsState.forEach((r) => {
      totalGiven += r.givenPieces;
      totalReturned += Number(r.returnedPieces) || 0;
      totalDamaged += Number(r.damagedPieces) || 0;
    });

    const totalRemaining = Math.max(0, totalGiven - (totalReturned + totalDamaged));
    const isFullReturn = totalReturned + totalDamaged >= totalGiven && totalGiven > 0;

    return {
      totalGiven,
      totalReturned,
      totalDamaged,
      totalRemaining,
      isFullReturn,
    };
  }, [rowsState]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate each row
    for (const r of rowsState) {
      const ret = Number(r.returnedPieces) || 0;
      const dam = Number(r.damagedPieces) || 0;
      if (ret < 0 || dam < 0) {
        toast.error(`Quantities for "${r.colorName}" cannot be negative.`);
        return;
      }
      if (ret + dam > r.givenPieces) {
        toast.error(
          `Color "${r.colorName}": Returned (${ret}) + Damaged (${dam}) exceeds Given (${r.givenPieces}).`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await recordColorReturnAction(transaction.id, {
        returnDate,
        notes: notes.trim() || null,
        colorRows: rowsState.map((r) => ({
          id: r.id,
          colorName: r.colorName,
          givenPieces: r.givenPieces,
          returnedPieces: Number(r.returnedPieces) || 0,
          damagedPieces: Number(r.damagedPieces) || 0,
        })),
      });

      if (!res.success) {
        toast.error(res.error || "Failed to record return.");
      } else {
        toast.success(
          `✓ Return recorded successfully! Status: ${res.data?.status === "COMPLETED" ? "Completed" : "Partially Returned"}`
        );
        router.push("/work");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/work"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Record Work Return (Lenvanu)</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Reconcile returned and damaged pieces per color variation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFillAllRemaining}
          className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Full Return (All Pcs)</span>
        </button>
      </div>

      {/* Order Context Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{transaction.customer.name}</p>
              <p className="text-xs text-slate-500">
                {transaction.customer.phoneNumber || "No phone"} • {transaction.customer.address || "Surat"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-black text-sm font-mono">
              <Hash className="w-3.5 h-3.5" />
              {transaction.designNumberSnapshot}
            </span>

            {transaction.categorySnapshot && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold">
                {transaction.categorySnapshot}
              </span>
            )}

            {transaction.cuttingStyleSnapshot && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                {transaction.cuttingStyleSnapshot}
              </span>
            )}

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Issued: {formatDate(transaction.issueDate)}
            </span>
          </div>
        </div>

        {/* 4-Metric Return Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Total Given Pieces
            </span>
            <p className="text-lg font-black text-blue-900 mt-0.5 font-mono">
              {formatNumber(totals.totalGiven)}{" "}
              <span className="text-xs font-normal text-blue-700">pcs</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Total Returned
            </span>
            <p className="text-lg font-black text-emerald-900 mt-0.5 font-mono">
              {formatNumber(totals.totalReturned)}{" "}
              <span className="text-xs font-normal text-emerald-700">pcs</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/60">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              Total Damaged
            </span>
            <p className="text-lg font-black text-red-900 mt-0.5 font-mono">
              {formatNumber(totals.totalDamaged)}{" "}
              <span className="text-xs font-normal text-red-700">pcs</span>
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              totals.totalRemaining > 0
                ? "bg-amber-50/80 border-amber-200"
                : "bg-emerald-50/80 border-emerald-200"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                totals.totalRemaining > 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              Remaining Outside
            </span>
            <p
              className={`text-lg font-black mt-0.5 font-mono ${
                totals.totalRemaining > 0 ? "text-amber-900" : "text-emerald-900"
              }`}
            >
              {formatNumber(totals.totalRemaining)}{" "}
              <span className="text-xs font-normal">pcs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Color-Wise Reconciliation Rows Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Color-Wise Reconciliation</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter returned and damaged pieces for each color row
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rowsState.map((row, index) => {
            const swatch = getColorSwatch(row.colorName);
            const returned = Number(row.returnedPieces) || 0;
            const damaged = Number(row.damagedPieces) || 0;
            const remaining = Math.max(0, row.givenPieces - (returned + damaged));
            const isRowComplete = returned + damaged >= row.givenPieces;

            return (
              <div
                key={row.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isRowComplete
                    ? "bg-emerald-50/30 border-emerald-200"
                    : "bg-slate-50/80 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: swatch.bg,
                        borderColor: swatch.border,
                      }}
                    />
                    <span className="font-bold text-sm text-slate-900">
                      {row.colorName}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-600 font-mono">
                    Given: {formatNumber(row.givenPieces)} pcs
                  </span>
                </div>

                {/* Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Returned Pieces */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Returned Pieces <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={row.givenPieces}
                      required
                      value={row.returnedPieces}
                      onChange={(e) =>
                        handleRowChange(
                          row.id,
                          "returnedPieces",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm font-bold font-mono bg-white text-slate-900"
                    />
                  </div>

                  {/* Damaged Pieces */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                      Damaged / Scrap Pieces
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={row.givenPieces}
                      required
                      value={row.damagedPieces}
                      onChange={(e) =>
                        handleRowChange(
                          row.id,
                          "damagedPieces",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-red-200 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden text-sm font-bold font-mono bg-white text-slate-900"
                    />
                  </div>

                  {/* Remaining Outside Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Remaining Outside
                    </label>
                    <div className="min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between font-mono">
                      <span className="text-xs font-bold text-slate-700">
                        {remaining} pcs
                      </span>
                      {isRowComplete ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ Complete
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Return Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Return Date <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm font-semibold font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Return Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Returned in 2 batches, excellent cutting quality..."
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-xs"
            />
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[50px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Return Reconciliation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                {totals.isFullReturn
                  ? "Complete & Settle Return (Lenvanu)"
                  : "Save Partial Return (Lenvanu)"}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
