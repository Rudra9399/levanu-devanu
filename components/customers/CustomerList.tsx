"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  FileText,
  Package,
  IndianRupee,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Download,
  RotateCcw,
  X,
  Clock,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { deleteCustomerAction } from "@/lib/actions/customer-actions";

export interface CustomerWithStats {
  id: string;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  _count: {
    transactions: number;
    payments?: number;
  };
  pendingCount: number;
  pendingPieces: number;
  totalPayable: number;
  totalPaid: number;
  outstandingBalance: number;
}

interface CustomerListProps {
  initialCustomers: CustomerWithStats[];
}

const AVATAR_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-cyan-100 text-cyan-700",
  "bg-amber-100 text-amber-700",
];

export function CustomerList({ initialCustomers }: CustomerListProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDropdown, setStatusDropdown] = useState("ALL");
  const [outstandingDropdown, setOutstandingDropdown] = useState("ALL");
  const [areaDropdown, setAreaDropdown] = useState("ALL");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "WITH_PAYMENT" | "WITH_WORK"
  >("ALL");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Distinct Areas
  const distinctAreas = useMemo(() => {
    const areas = new Set<string>();
    initialCustomers.forEach((c) => {
      if (c.address && c.address.trim()) {
        const parts = c.address.split(",");
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart) areas.add(lastPart);
      }
    });
    return Array.from(areas);
  }, [initialCustomers]);

  // Aggregate Metrics
  const totalCount = initialCustomers.length;
  const activeCount = initialCustomers.filter((c) => c.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const withWorkCount = initialCustomers.filter((c) => c.pendingCount > 0).length;
  const withPaymentCount = initialCustomers.filter(
    (c) => c.outstandingBalance > 0
  ).length;

  const totalOutsidePieces = initialCustomers.reduce(
    (sum, c) => sum + c.pendingPieces,
    0
  );
  const totalOutstanding = initialCustomers.reduce(
    (sum, c) => sum + (c.outstandingBalance > 0 ? c.outstandingBalance : 0),
    0
  );

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      // 1. Tab filter
      if (activeTab === "ACTIVE" && !c.isActive) return false;
      if (activeTab === "INACTIVE" && c.isActive) return false;
      if (activeTab === "WITH_PAYMENT" && c.outstandingBalance <= 0) return false;
      if (activeTab === "WITH_WORK" && c.pendingCount <= 0) return false;

      // 2. Status Dropdown
      if (statusDropdown === "ACTIVE" && !c.isActive) return false;
      if (statusDropdown === "INACTIVE" && c.isActive) return false;

      // 3. Outstanding Dropdown
      if (outstandingDropdown === "WITH_BALANCE" && c.outstandingBalance <= 0)
        return false;
      if (outstandingDropdown === "ZERO_BALANCE" && c.outstandingBalance > 0)
        return false;

      // 4. Area Dropdown
      if (areaDropdown !== "ALL") {
        if (!c.address || !c.address.toLowerCase().includes(areaDropdown.toLowerCase()))
          return false;
      }

      // 5. Search text
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phoneNumber && c.phoneNumber.includes(q);
        const matchAddress = c.address && c.address.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddress) return false;
      }

      return true;
    });
  }, [
    initialCustomers,
    activeTab,
    statusDropdown,
    outstandingDropdown,
    areaDropdown,
    searchQuery,
  ]);

  const handleClear = () => {
    setSearchQuery("");
    setStatusDropdown("ALL");
    setOutstandingDropdown("ALL");
    setAreaDropdown("ALL");
    setActiveTab("ALL");
  };

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      toast.error("No worker data to export.");
      return;
    }

    const headers = [
      "#",
      "Worker Name",
      "Phone Number",
      "Address / Area",
      "Active Work Orders",
      "Pieces Outside",
      "Outstanding Balance",
      "Status",
    ];

    const rows = filteredCustomers.map((c, idx) => [
      idx + 1,
      `"${c.name}"`,
      `"${c.phoneNumber || ""}"`,
      `"${c.address || ""}"`,
      c.pendingCount,
      c.pendingPieces,
      c.outstandingBalance,
      c.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Workers_Directory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workers directory exported successfully!");
  };

  const handleDelete = async (c: CustomerWithStats) => {
    if (!confirm(`Are you sure you want to delete worker "${c.name}"?`)) {
      return;
    }

    setDeletingId(c.id);
    try {
      const res = await deleteCustomerAction(c.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete worker.");
      } else {
        toast.success(`Worker "${c.name}" deleted successfully.`);
        router.refresh();
      }
    } catch {
      toast.error("Error deleting worker.");
    } finally {
      setDeletingId(null);
    }
  };

  const getInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || "W";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Workers Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Worker directory, pieces outside status, and hisab ledger balances
            </p>
          </div>
        </div>

        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Worker</span>
        </Link>
      </div>

      {/* 4 Top KPI Cards (2 per row on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: TOTAL WORKERS */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 truncate">
                Total Workers
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none font-mono">
                {totalCount}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                {activeCount} active • {inactiveCount} inactive
              </p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-blue-500 rounded-full mt-2.5" />
        </div>

        {/* Card 2: ACTIVE JOB WORK */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 truncate">
                Active Orders
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none font-mono">
                {withWorkCount}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Workers with active orders</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-amber-500 rounded-full mt-2.5" />
        </div>

        {/* Card 3: PIECES OUTSIDE */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 truncate">
                Pieces Outside
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-indigo-600 tracking-tight leading-none font-mono">
                {formatNumber(totalOutsidePieces)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Pending return</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-purple-500 rounded-full mt-2.5" />
        </div>

        {/* Card 4: LIVE OUTSTANDING */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 truncate">
                Outstanding
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-3xl font-black text-emerald-700 tracking-tight leading-none font-mono">
                {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Payable balance due</p>
            </div>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-emerald-500 rounded-full mt-2.5" />
        </div>
      </div>

      {/* Filter & Search Bar Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5 sm:gap-3">
          {/* Main search input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker name, 10-digit phone, or area..."
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

          {/* Sub-Filters Grid (2 cols on mobile, flex on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-end gap-2 sm:gap-3">
            {/* Status Dropdown */}
            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Status
              </label>
              <select
                value={statusDropdown}
                onChange={(e) => setStatusDropdown(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
              >
                <option value="ALL">All Workers</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Outstanding Dropdown */}
            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Outstanding
              </label>
              <select
                value={outstandingDropdown}
                onChange={(e) => setOutstandingDropdown(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
              >
                <option value="ALL">All</option>
                <option value="WITH_BALANCE">With Balance</option>
                <option value="ZERO_BALANCE">Zero Balance</option>
              </select>
            </div>

            {/* Area / City Dropdown */}
            <div className="col-span-2 sm:col-span-1 w-full sm:w-40">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Area / City
              </label>
              <select
                value={areaDropdown}
                onChange={(e) => setAreaDropdown(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
              >
                <option value="ALL">All Areas</option>
                {distinctAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          {(searchQuery ||
            statusDropdown !== "ALL" ||
            outstandingDropdown !== "ALL" ||
            areaDropdown !== "ALL") && (
            <div className="flex items-center gap-2 pt-1 lg:pt-0">
              <button
                onClick={handleClear}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row & Export Excel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 px-2">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === "ALL"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Workers ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === "ACTIVE"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("INACTIVE")}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === "INACTIVE"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Inactive ({inactiveCount})
          </button>
          <button
            onClick={() => setActiveTab("WITH_PAYMENT")}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === "WITH_PAYMENT"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            With Pending Payment ({withPaymentCount})
          </button>
          <button
            onClick={() => setActiveTab("WITH_WORK")}
            className={`pb-3 text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === "WITH_WORK"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            With Active Work ({withWorkCount})
          </button>
        </div>

        <button
          onClick={handleExportExcel}
          type="button"
          className="inline-flex items-center gap-1.5 pb-2 sm:pb-0 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors self-end sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Main Table View */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No workers found</p>
          <p className="text-xs text-slate-400">
            {searchQuery ||
            statusDropdown !== "ALL" ||
            outstandingDropdown !== "ALL" ||
            areaDropdown !== "ALL"
              ? "No workers match the selected filters."
              : "No workers registered yet."}
          </p>
          <button
            onClick={handleClear}
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
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Area / Address</th>
                  <th className="py-3 px-4">Active Work</th>
                  <th className="py-3 px-4">Pieces Outside</th>
                  <th className="py-3 px-4">Outstanding (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCustomers.map((c, idx) => {
                  const avatarColor =
                    AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Worker initial, name & active order info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}
                          >
                            {getInitial(c.name)}
                          </div>
                          <div>
                            <Link
                              href={`/customers/${c.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 block"
                            >
                              {c.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {c.pendingCount > 0
                                ? `${c.pendingCount} active order${
                                    c.pendingCount > 1 ? "s" : ""
                                  }`
                                : "No active orders"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number & WhatsApp link */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.phoneNumber ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-blue-500" />
                            <a
                              href={`tel:${c.phoneNumber}`}
                              className="hover:text-blue-600 font-semibold"
                            >
                              {c.phoneNumber}
                            </a>
                            <a
                              href={`https://wa.me/91${c.phoneNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors ml-0.5"
                              title="Message on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Area / Address */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {c.address || "-"}
                      </td>

                      {/* Active Work Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                            <Package className="w-3.5 h-3.5" />
                            <span>
                              {c.pendingCount} Order
                              {c.pendingCount > 1 ? "s" : ""}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 font-semibold text-xs">
                            <Package className="w-3.5 h-3.5" />
                            <span>0 Orders</span>
                          </span>
                        )}
                      </td>

                      {/* Pieces Outside */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {formatNumber(c.pendingPieces)}
                      </td>

                      {/* Outstanding (₹) */}
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            c.outstandingBalance > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }
                        >
                          {formatCurrency(c.outstandingBalance)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.isActive ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/customers/${c.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Financial Profile & History"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/customers/${c.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="Edit Worker Profile"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === c.id}
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Worker"
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
        </div>
      )}
    </div>
  );
}
