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
  Layers,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Loader2,
  Sparkles,
  Info,
  Check,
  IndianRupee,
  Save,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";
import {
  createWorkTransactionAction,
  updateWorkTransactionAction,
} from "@/lib/actions/transaction-actions";

interface WorkerOption {
  id: string;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
}

interface DesignNumberOption {
  id: string;
  designNumber: string;
}

interface MasterOption {
  id: string;
  name: string;
}

export interface InitialWorkOrderData {
  id: string;
  customerId: string;
  designNumberId?: string | null;
  designNumber: string;
  categoryId?: string | null;
  categoryName: string;
  cuttingStyleId?: string | null;
  cuttingStyleName: string;
  issueDate: string;
  notes?: string | null;
  colorRows: Array<{
    id?: string;
    colorId?: string | null;
    colorName: string;
    heads: number;
    piecesPerHead: number;
    rate: number;
  }>;
}

interface IssueWorkFormProps {
  customers: WorkerOption[];
  designNumbers: DesignNumberOption[];
  categories: MasterOption[];
  cuttingStyles: MasterOption[];
  colorsMaster: MasterOption[];
  preselectedCustomerId?: string;
  preselectedDesignNumberId?: string;
  isEdit?: boolean;
  transactionId?: string;
  initialData?: InitialWorkOrderData;
}

interface ColorRowState {
  id: string; // client temporary ID
  colorId: string;
  colorName: string;
  heads: number | "";
  piecesPerHead: number | "";
  rate: number | "";
}

export function IssueWorkForm({
  customers,
  designNumbers,
  categories,
  cuttingStyles,
  colorsMaster,
  preselectedCustomerId,
  preselectedDesignNumberId,
  isEdit = false,
  transactionId,
  initialData,
}: IssueWorkFormProps) {
  const router = useRouter();

  // Form states - Left Column
  const [customerId, setCustomerId] = useState(
    initialData?.customerId || preselectedCustomerId || ""
  );

  const matchedDesign = initialData?.designNumberId
    ? designNumbers.find((d) => d.id === initialData.designNumberId)
    : designNumbers.find(
        (d) => d.designNumber.toUpperCase() === initialData?.designNumber?.toUpperCase()
      );

  const [designNumberId, setDesignNumberId] = useState(() => {
    if (initialData) {
      return matchedDesign ? matchedDesign.id : "__CUSTOM__";
    }
    return preselectedDesignNumberId || "";
  });

  const [customDesignNumber, setCustomDesignNumber] = useState(
    initialData && !matchedDesign ? initialData.designNumber : ""
  );

  const matchedCategory = initialData?.categoryId
    ? categories.find((c) => c.id === initialData.categoryId)
    : categories.find(
        (c) => c.name.toLowerCase() === initialData?.categoryName?.toLowerCase()
      );

  const [categoryId, setCategoryId] = useState(() => {
    if (initialData) {
      return matchedCategory ? matchedCategory.id : "__CUSTOM__";
    }
    return categories[0]?.id || "";
  });

  const [customCategory, setCustomCategory] = useState(
    initialData && !matchedCategory ? initialData.categoryName : ""
  );

  const matchedCutting = initialData?.cuttingStyleId
    ? cuttingStyles.find((c) => c.id === initialData.cuttingStyleId)
    : cuttingStyles.find(
        (c) => c.name.toLowerCase() === initialData?.cuttingStyleName?.toLowerCase()
      );

  const [cuttingStyleId, setCuttingStyleId] = useState(
    matchedCutting ? matchedCutting.id : cuttingStyles[0]?.id || ""
  );

  const [issueDate, setIssueDate] = useState(() => {
    if (initialData?.issueDate) {
      return new Date(initialData.issueDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });

  const [notes, setNotes] = useState(initialData?.notes || "");

  // Form states - Right Column (Color Rows)
  const [colorRows, setColorRows] = useState<ColorRowState[]>(() => {
    if (initialData?.colorRows && initialData.colorRows.length > 0) {
      return initialData.colorRows.map((r, idx) => {
        const matchedMaster = r.colorId
          ? colorsMaster.find((c) => c.id === r.colorId)
          : colorsMaster.find(
              (c) => c.name.toLowerCase() === r.colorName.toLowerCase()
            );

        return {
          id: r.id || `row-${idx}-${Date.now()}`,
          colorId: matchedMaster ? matchedMaster.id : r.colorId || "",
          colorName: r.colorName,
          heads: r.heads,
          piecesPerHead: r.piecesPerHead,
          rate: r.rate,
        };
      });
    }

    return [
      {
        id: "row-1",
        colorId: colorsMaster[0]?.id || "",
        colorName: colorsMaster[0]?.name || "Black",
        heads: 100,
        piecesPerHead: 10,
        rate: 0.25,
      },
    ];
  });

  const [loading, setLoading] = useState(false);

  // Selected Snapshots
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const selectedDesignNumber = useMemo(() => {
    if (designNumberId === "__CUSTOM__") return customDesignNumber.trim().toUpperCase();
    const match = designNumbers.find((d) => d.id === designNumberId);
    return match ? match.designNumber : "";
  }, [designNumbers, designNumberId, customDesignNumber]);

  const selectedCategoryName = useMemo(() => {
    if (categoryId === "__CUSTOM__") return customCategory.trim();
    const match = categories.find((c) => c.id === categoryId);
    return match ? match.name : "";
  }, [categories, categoryId, customCategory]);

  const selectedCuttingStyleName = useMemo(() => {
    const match = cuttingStyles.find((c) => c.id === cuttingStyleId);
    return match ? match.name : "";
  }, [cuttingStyles, cuttingStyleId]);

  // Handle adding a color row
  const handleAddColorRow = () => {
    // Find next unused color if possible
    const usedColorNames = new Set(colorRows.map((r) => r.colorName.toLowerCase()));
    const nextColor =
      colorsMaster.find((c) => !usedColorNames.has(c.name.toLowerCase())) ||
      colorsMaster[0] || { id: "", name: "Custom" };

    // Default rate & pieces/head to previous row's values
    const lastRow = colorRows[colorRows.length - 1];
    const defaultPieces = lastRow ? lastRow.piecesPerHead : 10;
    const defaultRate = lastRow ? lastRow.rate : 0.25;

    setColorRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        colorId: nextColor.id,
        colorName: nextColor.name,
        heads: 50,
        piecesPerHead: defaultPieces,
        rate: defaultRate,
      },
    ]);
  };

  // Handle removing a color row
  const handleRemoveColorRow = (rowId: string) => {
    if (colorRows.length <= 1) {
      toast.error("At least one color row is required.");
      return;
    }
    setColorRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Handle updating a color row field
  const handleRowChange = (
    rowId: string,
    field: keyof ColorRowState,
    value: any
  ) => {
    setColorRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (field === "colorId") {
          const match = colorsMaster.find((c) => c.id === value);
          return {
            ...row,
            colorId: value,
            colorName: match ? match.name : row.colorName,
          };
        }

        return { ...row, [field]: value };
      })
    );
  };

  // Totals calculations
  const totals = useMemo(() => {
    let totalHeads = 0;
    let totalGivenPieces = 0;
    let totalOrderAmount = 0;

    colorRows.forEach((row) => {
      const h = Number(row.heads) || 0;
      const p = Number(row.piecesPerHead) || 0;
      const r = Number(row.rate) || 0;

      const given = h * p;
      const amt = given * r;

      totalHeads += h;
      totalGivenPieces += given;
      totalOrderAmount += amt;
    });

    return {
      totalHeads,
      totalGivenPieces,
      totalOrderAmount: Number(totalOrderAmount.toFixed(2)),
    };
  }, [colorRows]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Please select a worker.");
      return;
    }

    if (!selectedDesignNumber) {
      toast.error("Please select or enter a design number.");
      return;
    }

    if (!selectedCategoryName) {
      toast.error("Please select a material category.");
      return;
    }

    if (!selectedCuttingStyleName) {
      toast.error("Please select a cutting style.");
      return;
    }

    // Validate rows
    for (let i = 0; i < colorRows.length; i++) {
      const r = colorRows[i];
      if (!r.colorName.trim()) {
        toast.error(`Row ${i + 1}: Color name is required.`);
        return;
      }
      if (!r.heads || Number(r.heads) <= 0) {
        toast.error(`Row ${i + 1} (${r.colorName}): Heads must be greater than 0.`);
        return;
      }
      if (!r.piecesPerHead || Number(r.piecesPerHead) <= 0) {
        toast.error(`Row ${i + 1} (${r.colorName}): Pieces per head must be greater than 0.`);
        return;
      }
      if (r.rate === "" || Number(r.rate) < 0) {
        toast.error(`Row ${i + 1} (${r.colorName}): Rate must be 0 or greater.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        customerId,
        designNumberId: designNumberId === "__CUSTOM__" ? null : designNumberId || null,
        designNumber: selectedDesignNumber,
        categoryId: categoryId === "__CUSTOM__" ? null : categoryId || null,
        categoryName: selectedCategoryName,
        cuttingStyleId: cuttingStyleId || null,
        cuttingStyleName: selectedCuttingStyleName,
        issueDate,
        notes: notes.trim() || null,
        colorRows: colorRows.map((r) => ({
          colorId: r.colorId || null,
          colorName: r.colorName.trim(),
          heads: Number(r.heads),
          piecesPerHead: Number(r.piecesPerHead),
          rate: Number(r.rate),
        })),
      };

      if (isEdit && transactionId) {
        const res = await updateWorkTransactionAction(transactionId, payload);
        if (!res.success) {
          toast.error(res.error || "Failed to update work order.");
        } else {
          toast.success(
            `✓ Work order #${selectedDesignNumber} updated successfully!`
          );
          router.push("/work");
          router.refresh();
        }
      } else {
        const res = await createWorkTransactionAction(payload);
        if (!res.success) {
          toast.error(res.error || "Failed to issue work.");
        } else {
          toast.success(
            `✓ Work issued for #${selectedDesignNumber} (${formatNumber(totals.totalGivenPieces)} pcs) successfully!`
          );
          router.push("/work");
          router.refresh();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={isEdit && transactionId ? `/work/${transactionId}` : "/work"}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Scissors className="w-6 h-6 text-blue-600" />
              <span>{isEdit ? "Edit Work Order (Devanu)" : "Issue Work (Devanu)"}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {isEdit
                ? "Update color-wise piece calculations and worker job assignment"
                : "Create color-wise piece cutting assignment for worker"}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: WORKER, DESIGN, CATEGORY, CUTTING, DATE */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>1. Order & Worker Details</span>
            </h2>

            {/* Worker Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Worker / Karigar <span className="text-red-500">*</span></span>
                <Link
                  href="/customers/new"
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  + Add New
                </Link>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-semibold bg-white text-slate-900"
              >
                <option value="">-- Select Worker --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ""}
                  </option>
                ))}
              </select>
              {selectedCustomer?.address && (
                <p className="text-[11px] text-slate-500 italic">
                  Area: {selectedCustomer.address}
                </p>
              )}
            </div>

            {/* Design Number Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Design Number <span className="text-red-500">*</span></span>
                <Link
                  href="/design-numbers"
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  Manage Codes
                </Link>
              </label>
              <select
                required
                value={designNumberId}
                onChange={(e) => setDesignNumberId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-bold bg-white text-slate-900 font-mono tracking-wide"
              >
                <option value="">-- Select Design Number --</option>
                {designNumbers.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.designNumber}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter New Design Code...</option>
              </select>

              {designNumberId === "__CUSTOM__" && (
                <input
                  type="text"
                  required
                  placeholder="Type new design number (e.g. D-1008)..."
                  value={customDesignNumber}
                  onChange={(e) => setCustomDesignNumber(e.target.value.toUpperCase())}
                  className="w-full mt-2 min-h-[44px] px-3.5 rounded-xl border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-bold font-mono tracking-wide"
                />
              )}
            </div>

            {/* Material Category Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Material Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-semibold bg-white text-slate-900"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Custom Category...</option>
              </select>

              {categoryId === "__CUSTOM__" && (
                <input
                  type="text"
                  required
                  placeholder="Enter custom category (e.g. Dupatta Net)..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 min-h-[44px] px-3.5 rounded-xl border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-semibold"
                />
              )}
            </div>

            {/* Cutting Style Visual Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cutting Style (Work Type) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cuttingStyles.map((cut) => {
                  const isSelected = cuttingStyleId === cut.id;
                  return (
                    <button
                      key={cut.id}
                      type="button"
                      onClick={() => setCuttingStyleId(cut.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Scissors className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      <span>{cut.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issue Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Issue Date <span className="text-red-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm font-semibold font-mono"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Remarks / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Urgent lot, deliver by Friday..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: COLOR-WISE DETAILS & CALCULATIONS */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>2. Color Variations & Calculation Rows</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Heads, pieces/head, and rates are calculated individually per color
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddColorRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Color Row</span>
              </button>
            </div>

            {/* Color Rows List */}
            <div className="space-y-3">
              {colorRows.map((row, index) => {
                const swatch = getColorSwatch(row.colorName);
                const givenPieces = (Number(row.heads) || 0) * (Number(row.piecesPerHead) || 0);
                const rowAmount = givenPieces * (Number(row.rate) || 0);

                return (
                  <div
                    key={row.id}
                    className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
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
                        <span className="font-bold text-xs text-slate-800">
                          {row.colorName}
                        </span>
                      </div>

                      {colorRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColorRow(row.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove color row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Color Selector */}
                      <div className="col-span-2 sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Color
                        </label>
                        <select
                          value={row.colorId}
                          onChange={(e) =>
                            handleRowChange(row.id, "colorId", e.target.value)
                          }
                          className="w-full min-h-[42px] px-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden text-xs font-bold bg-white"
                        >
                          {colorsMaster.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Heads */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Heads
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={row.heads}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "heads",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 100"
                          className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden text-xs font-bold font-mono bg-white"
                        />
                      </div>

                      {/* Pieces per Head */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Pieces/Head
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={row.piecesPerHead}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "piecesPerHead",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 10"
                          className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden text-xs font-bold font-mono bg-white"
                        />
                      </div>

                      {/* Rate */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Rate (₹/pc)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={row.rate}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "rate",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 0.25"
                          className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden text-xs font-bold font-mono bg-white"
                        />
                      </div>
                    </div>

                    {/* Row Calculation Result Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <div className="text-slate-600">
                        Total: <strong className="font-mono text-slate-900">{formatNumber(givenPieces)} pcs</strong>{" "}
                        <span className="text-[11px] text-slate-400">
                          ({row.heads || 0} heads × {row.piecesPerHead || 0})
                        </span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(rowAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Total Color Rows:</span>
                <span className="font-mono font-bold text-white">
                  {colorRows.length} colors
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Total Combined Heads:</span>
                <span className="font-mono font-bold text-white">
                  {totals.totalHeads} heads
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Total Given Pieces:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {formatNumber(totals.totalGivenPieces)} pcs
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Total Order Value:
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatCurrency(totals.totalOrderAmount)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || colorRows.length === 0}
              className="w-full min-h-[50px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isEdit ? "Saving Changes..." : "Issuing Work Order..."}</span>
                </>
              ) : isEdit ? (
                <>
                  <Save className="w-5 h-5" />
                  <span>Update Work Order (Devanu)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Work Issue (Devanu)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
