"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Hash, Loader2, Sparkles } from "lucide-react";
import {
  createDesignNumberAction,
  updateDesignNumberAction,
} from "@/lib/actions/design-number-actions";

interface DesignNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  design?: {
    id: string;
    designNumber: string;
    isActive: boolean;
  } | null;
}

export function DesignNumberModal({ isOpen, onClose, design }: DesignNumberModalProps) {
  const router = useRouter();
  const isEditing = Boolean(design);

  const [designNumber, setDesignNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (design) {
      setDesignNumber(design.designNumber);
      setIsActive(design.isActive);
    } else {
      setDesignNumber("");
      setIsActive(true);
    }
    setError(null);
  }, [design, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = designNumber.trim().toUpperCase();

    if (!cleanNumber) {
      setError("Design number is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && design) {
        const res = await updateDesignNumberAction(design.id, {
          designNumber: cleanNumber,
          isActive,
        });
        if (!res.success) {
          setError(res.error || "Failed to update design number");
          toast.error(res.error || "Update failed");
        } else {
          toast.success(`Design #${cleanNumber} updated successfully`);
          onClose();
          router.refresh();
        }
      } else {
        const res = await createDesignNumberAction({
          designNumber: cleanNumber,
          isActive,
        });
        if (!res.success) {
          setError(res.error || "Failed to create design number");
          toast.error(res.error || "Creation failed");
        } else {
          toast.success(`Design #${cleanNumber} created successfully`);
          onClose();
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? "Edit Design Number" : "Add New Design Number"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing
                  ? "Update design code identifier"
                  : "Quick master registry for job-work designs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Design Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                #
              </div>
              <input
                type="text"
                autoFocus
                required
                value={designNumber}
                onChange={(e) => setDesignNumber(e.target.value.toUpperCase())}
                placeholder="e.g. D-1001, 1002, EMB-840"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-base font-bold tracking-wide text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Will be automatically formatted to uppercase.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="text-xs font-bold text-slate-900">Active Status</p>
              <p className="text-[11px] text-slate-500">
                Inactive designs will be hidden in new work issue dropdowns
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !designNumber.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isEditing ? "Save Changes" : "Create Design Number"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
