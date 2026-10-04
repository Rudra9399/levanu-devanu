"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Palette,
  Layers,
  Scissors,
  Plus,
  Trash2,
  Database,
  Pencil,
  Search,
  X,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  createColorAction,
  updateColorAction,
  toggleColorActiveAction,
  deleteColorAction,
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
  deleteCategoryAction,
  createCuttingAction,
  updateCuttingAction,
  toggleCuttingActiveAction,
  deleteCuttingAction,
} from "@/lib/actions/master-actions";
import { getColorSwatch } from "@/lib/color-utils";
import { formatDate } from "@/lib/utils";

export interface MasterItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  _count: {
    colorRows?: number;
    transactions?: number;
  };
}

interface MasterManagerProps {
  colors: MasterItem[];
  categories: MasterItem[];
  cuttings: MasterItem[];
  initialTab?: "color" | "category" | "cutting";
}

const PAGE_SIZE = 8;

export function MasterManager({
  colors,
  categories,
  cuttings,
  initialTab = "color",
}: MasterManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"color" | "category" | "cutting">(
    initialTab
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [editItem, setEditItem] = useState<MasterItem | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active collection
  const activeItems = useMemo(() => {
    if (activeTab === "color") return colors;
    if (activeTab === "category") return categories;
    return cuttings;
  }, [activeTab, colors, categories, cuttings]);

  // Filtered collection
  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (statusFilter === "ACTIVE" && !item.isActive) return false;
      if (statusFilter === "INACTIVE" && item.isActive) return false;

      return true;
    });
  }, [activeItems, search, statusFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const handleTabChange = (tab: "color" | "category" | "cutting") => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setModalMode("ADD");
    setEditItem(null);
    setNameInput("");
    setIsActiveInput(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MasterItem) => {
    setModalMode("EDIT");
    setEditItem(item);
    setNameInput(item.name);
    setIsActiveInput(item.isActive);
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    setLoading(true);
    try {
      if (modalMode === "ADD") {
        let res;
        if (activeTab === "color") res = await createColorAction(cleanName);
        else if (activeTab === "category")
          res = await createCategoryAction(cleanName);
        else res = await createCuttingAction(cleanName);

        if (!res.success) {
          toast.error(res.error || "Failed to create item.");
        } else {
          toast.success(`"${cleanName}" added to master.`);
          setModalOpen(false);
          router.refresh();
        }
      } else if (modalMode === "EDIT" && editItem) {
        let res;
        if (activeTab === "color")
          res = await updateColorAction(editItem.id, cleanName);
        else if (activeTab === "category")
          res = await updateCategoryAction(editItem.id, cleanName);
        else res = await updateCuttingAction(editItem.id, cleanName);

        if (!res.success) {
          toast.error(res.error || "Failed to update item.");
        } else {
          toast.success(`"${cleanName}" updated successfully.`);
          setModalOpen(false);
          router.refresh();
        }
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: MasterItem) => {
    setActionLoadingId(item.id);
    try {
      let res;
      if (activeTab === "color") res = await toggleColorActiveAction(item.id);
      else if (activeTab === "category")
        res = await toggleCategoryActiveAction(item.id);
      else res = await toggleCuttingActiveAction(item.id);

      if (!res.success) {
        toast.error(res.error || "Failed to toggle status");
      } else {
        toast.success(
          `"${item.name}" marked as ${
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

  const handleDelete = async (item: MasterItem) => {
    const usage =
      activeTab === "color"
        ? item._count.colorRows || 0
        : item._count.transactions || 0;

    if (usage > 0) {
      toast.error(
        `Cannot delete "${item.name}": Linked to ${usage} historical record(s). Mark inactive instead.`
      );
      return;
    }

    if (
      !confirm(`Are you sure you want to delete "${item.name}" from master?`)
    ) {
      return;
    }

    setActionLoadingId(item.id);
    try {
      let res;
      if (activeTab === "color") res = await deleteColorAction(item.id);
      else if (activeTab === "category")
        res = await deleteCategoryAction(item.id);
      else res = await deleteCuttingAction(item.id);

      if (!res.success) {
        toast.error(res.error || "Failed to delete item.");
      } else {
        toast.success(`"${item.name}" deleted successfully.`);
        router.refresh();
      }
    } catch {
      toast.error("Error deleting item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabLabels = {
    color: {
      title: "Colors Master",
      desc: "Colors configured here will be available in the color-wise multi-row calculator when issuing work orders.",
      btn: "+ Add Color",
      searchPlaceholder: "Search color name (e.g. Black, Red, Maroon...)",
      nameCol: "COLOR NAME",
      singular: "color",
      plural: "colors",
    },
    category: {
      title: "Material Categories Master",
      desc: "Categories (e.g. Net, Velvet, Packing) used for classifying fabric batches in work issue.",
      btn: "+ Add Category",
      searchPlaceholder: "Search category name (e.g. Net, Velvet, Watwat...)",
      nameCol: "CATEGORY NAME",
      singular: "category",
      plural: "categories",
    },
    cutting: {
      title: "Cutting Styles Master",
      desc: "Cutting styles and work types (e.g. Katar Cutting, Reniya Cutting) selectable when issuing work orders.",
      btn: "+ Add Cutting Style",
      searchPlaceholder: "Search cutting style (e.g. Katar Cutting, Reniya Cutting...)",
      nameCol: "CUTTING STYLE",
      singular: "cutting style",
      plural: "cutting styles",
    },
  };

  const currentTabInfo = tabLabels[activeTab];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Database className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              System Masters Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure Color variations, Material Categories, and Cutting styles
            </p>
          </div>
        </div>
      </div>

      {/* 3 Master Tabs Header */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
        <button
          onClick={() => handleTabChange("color")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "color"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Colors ({colors.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("category")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "category"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Material Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => handleTabChange("cutting")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "cutting"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Cutting Styles ({cuttings.length})</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        {/* Title and Add Button Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {currentTabInfo.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentTabInfo.desc}
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{currentTabInfo.btn}</span>
          </button>
        </div>

        {/* Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={currentTabInfo.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-40">
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* High-Density Data Table */}
        {paginatedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              No {currentTabInfo.plural} found
            </p>
            <p className="text-xs text-slate-400">
              {search || statusFilter !== "ALL"
                ? `No ${currentTabInfo.plural} matching the current filters.`
                : `No ${currentTabInfo.plural} configured yet.`}
            </p>
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset Search
              </button>
            ) : (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentTabInfo.btn}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">{currentTabInfo.nameCol}</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">WORK ITEMS</th>
                    <th className="py-3 px-4">CREATED DATE</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedItems.map((item) => {
                    const usage =
                      activeTab === "color"
                        ? item._count.colorRows || 0
                        : item._count.transactions || 0;
                    const swatch =
                      activeTab === "color"
                        ? getColorSwatch(item.name)
                        : null;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Name & Dot Preview */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {swatch && (
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: swatch.bg }}
                              />
                            )}
                            <span className="font-bold text-slate-900 text-xs">
                              {item.name}
                            </span>
                          </div>
                        </td>

                        {/* Status Toggle Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                            title="Click to toggle active status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isActive
                                  ? "bg-emerald-600"
                                  : "bg-rose-600"
                              }`}
                            />
                            <span>{item.isActive ? "Active" : "Inactive"}</span>
                          </button>
                        </td>

                        {/* Work Items Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold text-xs">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{usage} work items</span>
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(item.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/work?search=${encodeURIComponent(
                                item.name
                              )}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="View linked work orders"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                              title="Edit item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id || usage > 0}
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                usage > 0
                                  ? "Cannot delete: Linked to work items"
                                  : "Delete item"
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
                  {Math.min(
                    (currentPage - 1) * PAGE_SIZE + 1,
                    filteredItems.length
                  )}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * PAGE_SIZE, filteredItems.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredItems.length}
                </span>{" "}
                {currentTabInfo.plural}
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

      {/* Add / Edit Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {modalMode === "ADD" ? "Add New" : "Edit"}{" "}
                {activeTab === "color"
                  ? "Color"
                  : activeTab === "category"
                  ? "Material Category"
                  : "Cutting Style"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {activeTab === "color" && nameInput && (
                    <div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: getColorSwatch(nameInput).bg,
                        borderColor: getColorSwatch(nameInput).border,
                      }}
                    />
                  )}
                  <input
                    type="text"
                    autoFocus
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={`e.g. ${
                      activeTab === "color"
                        ? "Royal Blue, Maroon, Olive"
                        : activeTab === "category"
                        ? "Net, Velvet, Packing"
                        : "Katar Cutting, Reniya Cutting"
                    }`}
                    className={`w-full py-2.5 pr-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-semibold ${
                      activeTab === "color" && nameInput ? "pl-10" : "pl-4"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !nameInput.trim()}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {modalMode === "ADD" ? "Create Item" : "Save Changes"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
