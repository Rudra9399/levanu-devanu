"use client";

import Link from "next/link";
import { Phone, MapPin, Scissors, CheckCircle2, ChevronRight, Eye, Edit3 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    phoneNumber?: string | null;
    address?: string | null;
    isActive: boolean;
    _count?: {
      transactions: number;
    };
    pendingCount?: number;
    pendingPieces?: number;
  };
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const pendingCount = customer.pendingCount ?? 0;
  const pendingPieces = customer.pendingPieces ?? 0;
  const totalTx = customer._count?.transactions ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-blue-200 transition-all space-y-3.5">
      {/* Header with Name & Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {customer.name}
            </h3>
            {!customer.isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Archived
              </span>
            )}
          </div>
          {customer.address && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{customer.address}</span>
            </p>
          )}
        </div>

        {/* Call Link on Mobile */}
        {customer.phoneNumber && (
          <a
            href={`tel:${customer.phoneNumber}`}
            aria-label={`Call ${customer.name}`}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs flex items-center gap-1.5 active:bg-blue-100 transition-colors shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{customer.phoneNumber}</span>
          </a>
        )}
      </div>

      {/* Work Metrics Badges */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
            Pending Work
          </p>
          <p className="text-sm font-extrabold text-amber-900 mt-0.5">
            {pendingCount > 0 ? (
              <span>
                {pendingCount} jobs <span className="text-xs font-semibold font-mono">({formatNumber(pendingPieces)} pcs)</span>
              </span>
            ) : (
              <span className="text-slate-400 font-medium text-xs">None (Clear)</span>
            )}
          </p>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-sm font-extrabold text-slate-800 mt-0.5">
            {formatNumber(totalTx)} <span className="text-xs font-semibold text-slate-500">lifetime</span>
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/customers/${customer.id}`}
          className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Profile & Hisab</span>
        </Link>
        <Link
          href={`/customers/${customer.id}/edit`}
          aria-label={`Edit ${customer.name}`}
          className="min-h-[42px] min-w-[42px] rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
        </Link>
        {customer.isActive && (
          <Link
            href={`/work/new?customerId=${customer.id}`}
            aria-label={`Issue work to ${customer.name}`}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors active:scale-95"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Issue Work</span>
          </Link>
        )}
      </div>
    </div>
  );
}
