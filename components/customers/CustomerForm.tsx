"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { User, Phone, MapPin, FileText, Loader2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { customerSchema, type CustomerFormValues } from "@/lib/validations/customer";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customer-actions";

interface CustomerFormProps {
  initialData?: CustomerFormValues & { id?: string };
  isEdit?: boolean;
}

export function CustomerForm({ initialData, isEdit = false }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      phoneNumber: initialData?.phoneNumber || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        const result = await updateCustomerAction(initialData.id, data);
        if (!result.success) {
          toast.error(result.error || "Failed to update worker");
          return;
        }
        toast.success("✓ Worker updated successfully");
        router.push(`/customers/${initialData.id}`);
        router.refresh();
      } else {
        const result = await createCustomerAction(data);
        if (!result.success) {
          toast.error(result.error || "Failed to create worker");
          return;
        }
        toast.success("✓ Worker created successfully");
        router.push("/customers");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
      {/* Top Header Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/customers"
          className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? "Edit Worker Details" : "Add New Worker"}
          </h2>
          <p className="text-xs text-slate-500">
            {isEdit ? "Update profile information" : "Create a worker profile for tracking cutting work"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xs">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Worker Name <span className="text-red-500">*</span></span>
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="e.g. Rajeshbhai Patel"
            autoFocus
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm transition-all"
          />
          {errors.name && (
            <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Phone Number (type="tel" for native dialpad) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Phone Number (Mobile)</span>
          </label>
          <input
            {...register("phoneNumber")}
            type="tel"
            inputMode="tel"
            placeholder="e.g. 9876543210"
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm transition-all font-mono"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Address / Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Address / Workshop Area</span>
          </label>
          <input
            {...register("address")}
            type="text"
            placeholder="e.g. Katargam, Surat"
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm transition-all"
          />
          {errors.address && (
            <p className="text-xs text-red-500 font-medium">{errors.address.message}</p>
          )}
        </div>

        {/* Notes / Special Remarks */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Notes / Remarks (Optional)</span>
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="e.g. Specialist in Reniya Cutting or specific machines"
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-sm transition-all resize-none"
          />
          {errors.notes && (
            <p className="text-xs text-red-500 font-medium">{errors.notes.message}</p>
          )}
        </div>

        {/* Active Toggle (If Editing) */}
        {isEdit && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Active Status</p>
              <p className="text-[11px] text-slate-500">
                Inactive/archived workers won&apos;t appear in new work dispatch dropdowns
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}
      </div>

      {/* Sticky Bottom Form Action Bar for Mobile */}
      <div className="sticky bottom-16 md:bottom-4 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-2">
        <Link
          href="/customers"
          className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center justify-center transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Worker...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={3} />
              <span>{isEdit ? "Update Worker" : "Save Worker"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
