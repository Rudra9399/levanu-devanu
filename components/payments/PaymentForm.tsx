"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  IndianRupee,
  ArrowLeft,
  User,
  Calendar,
  Layers,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Hash,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  getOrdersForPaymentAction,
  createPaymentAction,
} from "@/lib/actions/payment-actions";

interface WorkerOption {
  id: string;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
}

interface PaymentFormProps {
  workers: WorkerOption[];
  preselectedWorkerId?: string;
}

export function PaymentForm({
  workers,
  preselectedWorkerId,
}: PaymentFormProps) {
  const router = useRouter();

  // Date Range Defaults (e.g. 1st of last month to end of today)
  const defaultFrom = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };

  const defaultTo = () => new Date().toISOString().split("T")[0];

  const [customerId, setCustomerId] = useState(preselectedWorkerId || workers[0]?.id || "");
  const [fromDate, setFromDate] = useState(defaultFrom());
  const [toDate, setToDate] = useState(defaultTo());
  const [paymentDate, setPaymentDate] = useState(defaultTo());
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("Cash Payment");

  // Preview data state
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    totalOrders: number;
    totalPayable: number;
    totalAlreadyPaid: number;
    outstandingPeriodBalance: number;
  }>({
    totalOrders: 0,
    totalPayable: 0,
    totalAlreadyPaid: 0,
    outstandingPeriodBalance: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch preview orders whenever worker or date range changes
  const fetchPreviewOrders = useCallback(async () => {
    if (!customerId || !fromDate || !toDate) return;

    setLoadingOrders(true);
    try {
      const res = await getOrdersForPaymentAction({
        customerId,
        fromDate,
        toDate,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
        setSummary(res.data.summary);
        // Pre-fill amount if not manually changed yet
        setPaymentAmount(res.data.summary.outstandingPeriodBalance);
      } else {
        setOrders([]);
        setSummary({
          totalOrders: 0,
          totalPayable: 0,
          totalAlreadyPaid: 0,
          outstandingPeriodBalance: 0,
        });
      }
    } catch {
      toast.error("Failed to load orders for preview.");
    } finally {
      setLoadingOrders(false);
    }
  }, [customerId, fromDate, toDate]);

  useEffect(() => {
    fetchPreviewOrders();
  }, [fetchPreviewOrders]);

  // Quick Preset Handlers
  const handleSetPreset = (preset: "thisMonth" | "lastMonth" | "last30Days" | "allTime") => {
    const today = new Date();
    if (preset === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "lastMonth") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(end.toISOString().split("T")[0]);
    } else if (preset === "last30Days") {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "allTime") {
      setFromDate("2020-01-01");
      setToDate(today.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Please select a worker.");
      return;
    }

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPaymentAction({
        customerId,
        fromDate,
        toDate,
        paymentDate,
        paymentAmount: Number(paymentAmount),
        notes: notes.trim() || null,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to record payment.");
      } else {
        toast.success(
          `✓ Payment of ${formatCurrency(Number(paymentAmount))} recorded & allocated successfully!`
        );
        router.push("/payments");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
              <span>Record Worker Payment</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Disburse cash / digital payment filtered strictly by work issue date range
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: WORKER, DATE RANGE & PAYMENT AMOUNT */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Worker & Period Range</span>
            </h2>

            {/* Worker Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Worker / Karigar <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-sm font-bold bg-white text-slate-900"
              >
                <option value="">-- Select Worker --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.phoneNumber ? `(${w.phoneNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Issue Date Range <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  (Filters by Devanu Date)
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => handleSetPreset("thisMonth")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset("lastMonth")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset("last30Days")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset("allTime")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  All Time
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">
                    From (Issue Date)
                  </span>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">
                    To (Issue Date)
                  </span>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden text-xs font-mono font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Payment Amount (₹) <span className="text-red-500">*</span></span>
                  {summary.outstandingPeriodBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(summary.outstandingPeriodBalance)}
                      className="text-[11px] text-emerald-600 font-bold hover:underline"
                    >
                      Fill Outstanding ({formatCurrency(summary.outstandingPeriodBalance)})
                    </button>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Enter amount (e.g. 5000)"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden text-lg font-black font-mono text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Mode / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Cash, GPay, Cheque..."
                    className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 focus:border-emerald-600 outline-hidden text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting || !paymentAmount || Number(paymentAmount) <= 0}
              className="w-full min-h-[50px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Disburse & Settle Payment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ELIGIBLE ORDERS PREVIEW & AUDIT LEDGER */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>2. Eligible Work Orders in Period</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Orders issued between {formatDate(fromDate)} and {formatDate(toDate)}
                </p>
              </div>

              {loadingOrders && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
            </div>

            {/* 3-Metric Summary Bar for Period */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Period Billing
                </span>
                <span className="text-base font-black text-blue-900 mt-0.5 block">
                  {formatCurrency(summary.totalPayable)}
                </span>
                <span className="text-[10px] text-blue-600">
                  {summary.totalOrders} order(s)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/60">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Already Paid
                </span>
                <span className="text-base font-black text-purple-900 mt-0.5 block">
                  {formatCurrency(summary.totalAlreadyPaid)}
                </span>
                <span className="text-[10px] text-purple-600">Settled previously</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  summary.outstandingPeriodBalance > 0
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">
                  Outstanding
                </span>
                <span className="text-base font-black mt-0.5 block">
                  {formatCurrency(summary.outstandingPeriodBalance)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {summary.outstandingPeriodBalance > 0 ? "Due for Period" : "Fully Settled"}
                </span>
              </div>
            </div>

            {/* List of Orders in Period */}
            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">
                  No work orders found in this date range
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try adjusting the &quot;From&quot; and &quot;To&quot; issue dates or select another worker.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold font-mono text-[11px]">
                          <Hash className="w-3 h-3" />
                          {o.designNumberSnapshot}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {o.categorySnapshot}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(o.issueDate)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatNumber(o.totalGivenPieces)} pieces • Returned:{" "}
                        {formatNumber(o.totalReturnedPieces)} pcs
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-900 text-xs">
                        {formatCurrency(o.totalAmount)}
                      </p>
                      {o.pendingAmount > 0 ? (
                        <p className="text-[10px] text-amber-700 font-bold font-mono">
                          Due: {formatCurrency(o.pendingAmount)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          ✓ Settled
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
