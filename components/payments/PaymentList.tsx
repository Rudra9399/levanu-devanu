"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  IndianRupee,
  Search,
  Plus,
  Calendar,
  Layers,
  Trash2,
  Eye,
  Pencil,
  X,
  FileText,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { deletePaymentAction } from "@/lib/actions/payment-actions";

export interface PaymentItem {
  id: string;
  customerId: string;
  fromDate: Date | string;
  toDate: Date | string;
  paymentDate: Date | string;
  paymentAmount: any;
  notes: string | null;
  createdAt: Date | string;
  customer: {
    id: string;
    name: string;
    phoneNumber?: string | null;
    address?: string | null;
  };
  allocations: Array<{
    id: string;
    allocatedAmount: any;
    workTransaction: {
      id: string;
      designNumberSnapshot: string;
      categorySnapshot: string | null;
      cuttingStyleSnapshot: string | null;
      issueDate: Date | string;
      totalAmount: any;
      totalGivenPieces: number;
      totalReturnedPieces: number;
    };
  }>;
}

interface WorkerOption {
  id: string;
  name: string;
}

interface PaymentListProps {
  initialPayments: PaymentItem[];
  totalPendingAmount?: number;
  workers?: WorkerOption[];
}

const PAGE_SIZE = 8;

export function PaymentList({
  initialPayments,
  totalPendingAmount = 0,
  workers = [],
}: PaymentListProps) {
  const router = useRouter();

  // Search & Filter State
  const [searchWorker, setSearchWorker] = useState("");
  const [workerFilter, setWorkerFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "THIS_MONTH" | "LAST_3_MONTHS" | "LAST_6_MONTHS"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive worker options
  const workerOptions = useMemo(() => {
    if (workers && workers.length > 0) return workers;
    const map = new Map<string, string>();
    initialPayments.forEach((p) => {
      if (p.customerId && p.customer?.name) {
        map.set(p.customerId, p.customer.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [workers, initialPayments]);

  // Time-based filtering counts
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const thisMonthCount = initialPayments.filter(
    (p) => new Date(p.paymentDate) >= startOfThisMonth
  ).length;
  const last3MonthsCount = initialPayments.filter(
    (p) => new Date(p.paymentDate) >= startOf3MonthsAgo
  ).length;
  const last6MonthsCount = initialPayments.filter(
    (p) => new Date(p.paymentDate) >= startOf6MonthsAgo
  ).length;

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return initialPayments.filter((p) => {
      // 1. Tab filter
      const pDate = new Date(p.paymentDate);
      if (activeTab === "THIS_MONTH" && pDate < startOfThisMonth) return false;
      if (activeTab === "LAST_3_MONTHS" && pDate < startOf3MonthsAgo)
        return false;
      if (activeTab === "LAST_6_MONTHS" && pDate < startOf6MonthsAgo)
        return false;

      // 2. Worker dropdown filter
      if (workerFilter !== "ALL") {
        if (p.customerId !== workerFilter) return false;
      }

      // 3. Worker / Phone search text
      const q = searchWorker.toLowerCase().trim();
      if (q) {
        const matchName = p.customer.name.toLowerCase().includes(q);
        const matchPhone =
          p.customer.phoneNumber && p.customer.phoneNumber.includes(q);
        const matchNotes = p.notes && p.notes.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes) return false;
      }

      // 4. Date Range (matches paymentDate between startDate and endDate)
      const pDateStr = pDate.toISOString().split("T")[0];
      if (startDate && pDateStr < startDate) {
        return false;
      }
      if (endDate && pDateStr > endDate) {
        return false;
      }

      return true;
    });
  }, [
    initialPayments,
    activeTab,
    workerFilter,
    searchWorker,
    startDate,
    endDate,
    startOfThisMonth,
    startOf3MonthsAgo,
    startOf6MonthsAgo,
  ]);

  // Pagination Math
  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, currentPage]);

  // Aggregate Stats
  const totalAmountPaid = initialPayments.reduce(
    (sum, p) => sum + Number(p.paymentAmount),
    0
  );
  const uniqueWorkersPaid = new Set(
    initialPayments.map((p) => p.customerId)
  ).size;

  const handleClearFilters = () => {
    setSearchWorker("");
    setWorkerFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPaymentStatus("ALL");
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  const handleDelete = async (p: PaymentItem) => {
    if (
      !confirm(
        `Delete payment of ${formatCurrency(
          Number(p.paymentAmount)
        )} to ${p.customer.name}? This will reset work order payment statuses.`
      )
    ) {
      return;
    }

    setDeletingId(p.id);
    try {
      const res = await deletePaymentAction(p.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete payment.");
      } else {
        toast.success("Payment deleted and ledger statuses updated.");
        router.refresh();
      }
    } catch {
      toast.error("Error deleting payment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/" className="hover:text-slate-600 transition-colors">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-slate-700 font-semibold">Worker Payments</span>
      </nav>

      {/* Page Title & Record Payment Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <IndianRupee className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Worker Payments & Settlements
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Record cash payments, mark orders as paid, and manage worker settlements
            </p>
          </div>
        </div>

        <Link
          href="/payments/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record New Payment</span>
        </Link>
      </div>

      {/* 4 Top Metric KPI Cards (2 per row on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: TOTAL DISBURSED */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 truncate">
                Disbursed
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-emerald-700 tracking-tight leading-none font-mono">
                {formatCurrency(totalAmountPaid)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Total paid to workers</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-emerald-500 rounded-full mt-2.5" />
        </div>

        {/* Card 2: PAYMENTS RECORDED */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 truncate">
                Payments
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none font-mono">
                {initialPayments.length}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Total payment entries</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-blue-500 rounded-full mt-2.5" />
        </div>

        {/* Card 3: WORKERS PAID */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 truncate">
                Workers Paid
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none font-mono">
                {uniqueWorkersPaid}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Workers settled</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-purple-500 rounded-full mt-2.5" />
        </div>

        {/* Card 4: PENDING PAYMENT */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 truncate">
                Pending
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-amber-700 tracking-tight leading-none font-mono">
                {formatCurrency(totalPendingAmount)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Outstanding amount</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-amber-500 rounded-full mt-2.5" />
        </div>
      </div>

      {/* Filter & Search Bar Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5 sm:gap-3">
          {/* Worker Search */}
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search Worker
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchWorker}
                onChange={(e) => {
                  setSearchWorker(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search worker name or phone number..."
                className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-hidden transition-all"
              />
              {searchWorker && (
                <button
                  type="button"
                  onClick={() => setSearchWorker("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters: 2-column on mobile, inline on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-end gap-2 sm:gap-3">
            {/* Worker Dropdown */}
            <div className="col-span-2 sm:col-span-1 w-full sm:w-44">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Worker
              </label>
              <select
                value={workerFilter}
                onChange={(e) => {
                  setWorkerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-hidden"
              >
                <option value="ALL">All Workers</option>
                {workerOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Payment Status Dropdown */}
            <div className="col-span-2 sm:col-span-1 w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-hidden"
              >
                <option value="ALL">All Payments</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Clear button */}
          {(searchWorker ||
            workerFilter !== "ALL" ||
            startDate ||
            endDate ||
            paymentStatus !== "ALL" ||
            activeTab !== "ALL") && (
            <div className="flex items-center pt-1 lg:pt-0">
              <button
                onClick={handleClearFilters}
                type="button"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200/80 px-2">
        <button
          onClick={() => {
            setActiveTab("ALL");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "ALL"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          All Payments ({initialPayments.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("THIS_MONTH");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "THIS_MONTH"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          This Month ({thisMonthCount})
        </button>
        <button
          onClick={() => {
            setActiveTab("LAST_3_MONTHS");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "LAST_3_MONTHS"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Last 3 Months ({last3MonthsCount})
        </button>
        <button
          onClick={() => {
            setActiveTab("LAST_6_MONTHS");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "LAST_6_MONTHS"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Last 6 Months ({last6MonthsCount})
        </button>
      </div>

      {/* Main Payments Table */}
      {paginatedPayments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <IndianRupee className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No payments found</p>
          <p className="text-xs text-slate-400">
            {searchWorker || workerFilter !== "ALL" || startDate || endDate || paymentStatus !== "ALL"
              ? "No payments matching the selected filters."
              : "No payments recorded yet."}
          </p>
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Period Range (Issue Date)</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedPayments.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Payment Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>

                      {/* Worker */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/customers/${p.customer.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 block"
                        >
                          {p.customer.name}
                        </Link>
                        {p.customer.phoneNumber && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {p.customer.phoneNumber}
                          </p>
                        )}
                      </td>

                      {/* Period Range */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(p.fromDate)} - {formatDate(p.toDate)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono whitespace-nowrap">
                        {formatCurrency(Number(p.paymentAmount))}
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{p.allocations.length} orders</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          Completed
                        </span>
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {p.notes && p.notes.toLowerCase().includes("bank")
                          ? "Bank Transfer"
                          : p.notes && p.notes.toLowerCase().includes("upi")
                          ? "UPI"
                          : "Cash"}
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 max-w-[160px] truncate">
                        {p.notes || "-"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Payment Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="View / Edit Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === p.id}
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  (currentPage - 1) * PAGE_SIZE + 1,
                  filteredPayments.length
                )}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, filteredPayments.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredPayments.length}
              </span>{" "}
              payments
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-8 h-8 px-2.5 rounded-lg font-bold text-xs transition-all ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details / Breakdown Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Payment Breakdown & Allocations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paid to {selectedPayment.customer.name} on{" "}
                    {formatDate(selectedPayment.paymentDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Total Disbursed Amount
                  </span>
                  <p className="text-2xl font-black text-emerald-800 font-mono">
                    {formatCurrency(Number(selectedPayment.paymentAmount))}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Period: {formatDate(selectedPayment.fromDate)} &rarr;{" "}
                    {formatDate(selectedPayment.toDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
                    ✓ Completed
                  </span>
                </div>
              </div>

              {/* Allocated Orders List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Allocated Work Orders ({selectedPayment.allocations.length}):
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                  {selectedPayment.allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold font-mono text-[11px]">
                            <Hash className="w-3 h-3" />
                            {alloc.workTransaction.designNumberSnapshot}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {alloc.workTransaction.categorySnapshot}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            Issued: {formatDate(alloc.workTransaction.issueDate)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          Order Total: {formatCurrency(Number(alloc.workTransaction.totalAmount))} •{" "}
                          {formatNumber(alloc.workTransaction.totalGivenPieces)} pieces
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Allocated
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(Number(alloc.allocatedAmount))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
