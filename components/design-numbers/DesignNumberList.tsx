"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Hash,
  Search,
  Plus,
  Layers,
  CheckCircle2,
  XCircle,
  Link2,
  Info,
  FileText,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { DesignNumberModal } from "./DesignNumberModal";
import {
  toggleActiveDesignNumberAction,
  deleteDesignNumberAction,
} from "@/lib/actions/design-number-actions";
import { formatDate } from "@/lib/utils";

export interface DesignNumberItem {
  id: string;
  designNumber: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  _count: {
    transactions: number;
  };
}

interface DesignNumberListProps {
  designs: DesignNumberItem[];
}

const PAGE_SIZE = 8;

export function DesignNumberList({ designs }: DesignNumberListProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignNumberItem | null>(
    null
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Aggregate Metrics
  const totalCount = designs.length;
  const activeCount = designs.filter((d) => d.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const totalTransactionsLinked = designs.reduce(
    (acc, d) => acc + d._count.transactions,
    0
  );

  // Filtered designs
  const filtered = useMemo(() => {
    return designs.filter((d) => {
      const matchesSearch = d.designNumber
        .toLowerCase()
        .includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return d.isActive;
      if (statusFilter === "INACTIVE") return !d.isActive;
      return true;
    });
  }, [designs, search, statusFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleOpenAdd = () => {
    setSelectedDesign(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (design: DesignNumberItem) => {
    setSelectedDesign(design);
    setModalOpen(true);
  };

  const handleToggleActive = async (design: DesignNumberItem) => {
    setActionLoadingId(design.id);
    try {
      const res = await toggleActiveDesignNumberAction(design.id);
      if (!res.success) {
        toast.error(res.error || "Failed to toggle status");
      } else {
        toast.success(
          `Design #${design.designNumber} marked as ${
            res.data?.isActive ? "Active" : "Inactive"
          }`
        );
        router.refresh();
      }
    } catch {
      toast.error("Error toggling status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (design: DesignNumberItem) => {
    if (design._count.transactions > 0) {
      toast.error(
        `Cannot delete #${design.designNumber}: Linked to ${design._count.transactions} work order(s). Mark inactive instead.`
      );
      return;
    }

    if (
      !confirm(`Are you sure you want to delete Design #${design.designNumber}?`)
    ) {
      return;
    }

    setActionLoadingId(design.id);
    try {
      const res = await deleteDesignNumberAction(design.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete design number");
      } else {
        toast.success(`Design #${design.designNumber} deleted`);
        router.refresh();
      }
    } catch {
      toast.error("Error deleting design number");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Hash className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Design Numbers Master
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Central registry of design identifiers for color-wise job-work calculation
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Design Number</span>
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <p>
          This master stores only <strong className="font-bold">design numbers</strong> (e.g. D-1001, D-1002). No colors, categories, rates or other details are stored here.
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL DESIGNS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
              TOTAL DESIGNS
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {totalCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Registered design numbers</p>
          </div>
        </div>

        {/* Card 2: ACTIVE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-3">
              ACTIVE
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {activeCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Available for work issue</p>
          </div>
        </div>

        {/* Card 3: INACTIVE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
              INACTIVE
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {inactiveCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Archived design numbers</p>
          </div>
        </div>

        {/* Card 4: WORK ORDERS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3">
              WORK ORDERS
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              {totalTransactionsLinked}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total linked work orders</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search design number (e.g. D-1001)..."
            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs self-stretch sm:self-auto">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Designs ({totalCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter("ACTIVE");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter("INACTIVE");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "INACTIVE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <Hash className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No design numbers found</p>
          <p className="text-xs text-slate-400">
            {search
              ? `No design matches "${search}". Try searching another keyword.`
              : "Get started by adding your first design number."}
          </p>
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Filter
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Design Number</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Design Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Work Orders Linked</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Updated Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginated.map((design) => {
                  return (
                    <tr
                      key={design.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Design Number Badge (First Column) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 font-bold text-xs font-mono">
                          {design.designNumber}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={actionLoadingId === design.id}
                          onClick={() => handleToggleActive(design)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            design.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              design.isActive ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          <span>{design.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Work Orders Linked */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{design._count.transactions} orders</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(design.createdAt)}
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(design.updatedAt || design.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/work?search=${encodeURIComponent(
                              design.designNumber
                            )}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Linked Work Orders"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(design)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="Edit Design Number"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              actionLoadingId === design.id ||
                              design._count.transactions > 0
                            }
                            onClick={() => handleDelete(design)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              design._count.transactions > 0
                                ? "Cannot delete: Linked to work orders"
                                : "Delete Design Number"
                            }
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
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filtered.length}
              </span>{" "}
              designs
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

      {/* Add / Edit Modal */}
      <DesignNumberModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        design={selectedDesign}
      />
    </div>
  );
}
