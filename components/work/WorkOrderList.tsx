"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  FileText,
  Clock,
  Layers,
  IndianRupee,
  ChevronRight,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  GitPullRequest,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber, formatDate, formatCurrency } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";
import { deleteWorkTransactionAction } from "@/lib/actions/transaction-actions";

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

export interface WorkTransactionItem {
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
}

interface WorkerOption {
  id: string;
  name: string;
}

interface WorkOrderListProps {
  initialTransactions: WorkTransactionItem[];
  workers?: WorkerOption[];
}

const PAGE_SIZE = 8;

export function WorkOrderList({
  initialTransactions,
  workers = [],
}: WorkOrderListProps) {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workerFilter, setWorkerFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "COMPLETED">(
    "ALL"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute Master Metrics
  const totalCount = initialTransactions.length;
  const pendingTransactions = initialTransactions.filter(
    (tx) => tx.workStatus === "PENDING" || tx.workStatus === "PARTIALLY_RETURNED"
  );
  const pendingCount = pendingTransactions.length;
  const completedCount = initialTransactions.filter(
    (tx) => tx.workStatus === "COMPLETED"
  ).length;

  const totalOutsidePieces = pendingTransactions.reduce(
    (sum, tx) =>
      sum +
      (tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces)),
    0
  );

  const totalOrderValue = initialTransactions.reduce(
    (sum, tx) => sum + Number(tx.totalAmount),
    0
  );

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      // 1. Tab filter
      if (activeTab === "PENDING") {
        if (
          tx.workStatus !== "PENDING" &&
          tx.workStatus !== "PARTIALLY_RETURNED"
        )
          return false;
      } else if (activeTab === "COMPLETED") {
        if (tx.workStatus !== "COMPLETED") return false;
      }

      // 2. Status Dropdown filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && tx.workStatus !== "PENDING")
          return false;
        if (
          statusFilter === "PARTIAL" &&
          tx.workStatus !== "PARTIALLY_RETURNED"
        )
          return false;
        if (statusFilter === "COMPLETED" && tx.workStatus !== "COMPLETED")
          return false;
      }

      // 3. Worker Dropdown filter
      if (workerFilter !== "ALL") {
        if (tx.customer.id !== workerFilter) return false;
      }

      // 4. Date Range filter (startDate & endDate)
      const txDateStr = new Date(tx.issueDate).toISOString().split("T")[0];
      if (startDate && txDateStr < startDate) {
        return false;
      }
      if (endDate && txDateStr > endDate) {
        return false;
      }

      // 5. Search text
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchWorker = tx.customer.name.toLowerCase().includes(q);
        const matchDesign = tx.designNumberSnapshot.toLowerCase().includes(q);
        const matchCat =
          tx.categorySnapshot && tx.categorySnapshot.toLowerCase().includes(q);
        const matchStyle =
          tx.cuttingStyleSnapshot &&
          tx.cuttingStyleSnapshot.toLowerCase().includes(q);
        const matchColor = tx.colorRows.some((c) =>
          c.colorNameSnapshot.toLowerCase().includes(q)
        );
        const matchPhone =
          tx.customer.phoneNumber && tx.customer.phoneNumber.includes(q);

        if (
          !matchWorker &&
          !matchDesign &&
          !matchCat &&
          !matchStyle &&
          !matchColor &&
          !matchPhone
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialTransactions,
    activeTab,
    statusFilter,
    workerFilter,
    startDate,
    endDate,
    searchQuery,
  ]);

  // Pagination Math
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setWorkerFilter("ALL");
    setStartDate("");
    setEndDate("");
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this work order for ${name}?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await deleteWorkTransactionAction(id);
      if (res.success) {
        toast.success("Work order deleted successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete work order");
      }
    } catch {
      toast.error("An error occurred while deleting.");
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
        <span className="text-slate-700 font-semibold">Work Orders</span>
      </nav>

      {/* Page Title & Issue Work Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <GitPullRequest className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Work Orders (Devanu & Lenvanu)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Track cutting work issued to workers and record per-color return reconciliations
            </p>
          </div>
        </div>

        <Link
          href="/work/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Issue New Work (Devanu)</span>
        </Link>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {totalCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                All recorded job transactions
              </p>
            </div>
          </div>
          <div className="h-1 w-8 bg-blue-500 rounded-full mt-2.5" />
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {pendingCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Active piece cutting outside
              </p>
            </div>
          </div>
          <div className="h-1 w-8 bg-amber-500 rounded-full mt-2.5" />
        </div>

        {/* Card 3: Pieces Outside */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pieces Outside
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-600 font-mono tracking-tight leading-none">
                {formatNumber(totalOutsidePieces)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Pieces awaiting return
              </p>
            </div>
          </div>
          <div className="h-1 w-8 bg-indigo-500 rounded-full mt-2.5" />
        </div>

        {/* Card 4: Total Order Value */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Order Value
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {formatCurrency(totalOrderValue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gross piece billings
              </p>
            </div>
          </div>
          <div className="h-1 w-8 bg-emerald-500 rounded-full mt-2.5" />
        </div>
      </div>

      {/* Filter & Search Bar Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5 sm:gap-3">
          {/* Main search */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search worker, design number, color, category..."
                className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters Grid: 2-columns on mobile, inline-flex on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-end gap-2 sm:gap-3">
            {/* Status Dropdown */}
            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Worker Dropdown */}
            <div className="w-full sm:w-40">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Worker
              </label>
              <select
                value={workerFilter}
                onChange={(e) => {
                  setWorkerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
              >
                <option value="ALL">All Workers</option>
                {workers.map((w) => (
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
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
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
                  className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Clear button */}
          {(searchQuery ||
            statusFilter !== "ALL" ||
            workerFilter !== "ALL" ||
            startDate ||
            endDate ||
            activeTab !== "ALL") && (
            <div className="flex items-center pt-1 lg:pt-0">
              <button
                onClick={handleClearFilters}
                type="button"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row */}
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
          All Orders ({totalCount})
        </button>
        <button
          onClick={() => {
            setActiveTab("PENDING");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "PENDING"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Pending / Active ({pendingCount})
        </button>
        <button
          onClick={() => {
            setActiveTab("COMPLETED");
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "COMPLETED"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Main Table View */}
      {paginatedTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <GitPullRequest className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No work orders found</p>
          <p className="text-xs text-slate-400">
            {searchQuery || statusFilter !== "ALL" || workerFilter !== "ALL" || startDate || endDate
              ? "No work orders matching the active filters."
              : "No work transactions recorded yet."}
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
                  <th className="py-3 px-4">Design No.</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Work Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Colors</th>
                  <th className="py-3 px-4">Given / Returned</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedTransactions.map((tx) => {
                  const isPending =
                    tx.workStatus === "PENDING" ||
                    tx.workStatus === "PARTIALLY_RETURNED";
                  const remainingPieces = Math.max(
                    0,
                    tx.totalGivenPieces -
                      (tx.totalReturnedPieces + tx.totalDamagedPieces)
                  );

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Design Number Badge (First Column) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 font-bold text-xs font-mono">
                          {tx.designNumberSnapshot}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(tx.issueDate)}
                      </td>

                      {/* Worker Name & Mobile */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/customers/${tx.customer.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 block"
                        >
                          {tx.customer.name}
                        </Link>
                        {tx.customer.phoneNumber && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {tx.customer.phoneNumber}
                          </p>
                        )}
                      </td>

                      {/* Work Type Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {tx.cuttingStyleSnapshot || "Standard"}
                        </span>
                      </td>

                      {/* Category Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {tx.categorySnapshot || "General"}
                        </span>
                      </td>

                      {/* Colors Badges */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tx.colorRows.slice(0, 3).map((r) => (
                            <span
                              key={r.id}
                              title={`${r.colorNameSnapshot} (${r.givenPieces} pcs)`}
                              className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/80"
                            >
                              {r.colorNameSnapshot}
                            </span>
                          ))}
                          {tx.colorRows.length > 3 && (
                            <span
                              title={tx.colorRows
                                .slice(3)
                                .map((r) => r.colorNameSnapshot)
                                .join(", ")}
                              className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200"
                            >
                              +{tx.colorRows.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Given / Returned */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono">
                          <span className="font-bold text-slate-900">
                            {formatNumber(tx.totalGivenPieces)}
                          </span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span
                            className={`font-bold ${
                              tx.totalReturnedPieces > 0
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          >
                            {formatNumber(tx.totalReturnedPieces)}
                          </span>
                        </div>
                        {isPending ? (
                          <p className="text-[11px] text-slate-400 font-medium">
                            {formatNumber(remainingPieces)} pcs outside
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium">
                            0 pcs outside
                          </p>
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatCurrency(Number(tx.totalAmount))}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.workStatus === "COMPLETED" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            Completed
                          </span>
                        ) : tx.workStatus === "PARTIALLY_RETURNED" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.paymentStatus === "PAID" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            Paid
                          </span>
                        ) : tx.paymentStatus === "PARTIALLY_PAID" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[11px] font-bold">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold">
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/work/${tx.id}/return`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Record Return (Lenvanu)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/work/${tx.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/work/${tx.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="Edit Order"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            onClick={() => handleDelete(tx.id, tx.customer.name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Order"
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
                  filteredTransactions.length
                )}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredTransactions.length}
              </span>{" "}
              orders
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
    </div>
  );
}
