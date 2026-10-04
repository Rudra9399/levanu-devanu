import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Scissors,
  CheckCircle2,
  Clock,
  User,
  Hash,
  Calendar,
  IndianRupee,
  Layers,
  FileText,
  Pencil,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate, formatCurrency } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";

interface WorkOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Work Order Details | Devanu-Lenvanu",
  description: "View color-wise breakdown and reconciliation ledger for work order.",
};

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const { id } = await params;

  const transaction = await prisma.workTransaction.findUnique({
    where: { id },
    include: {
      customer: true,
      colorRows: {
        orderBy: { createdAt: "asc" },
      },
      paymentAllocations: {
        include: {
          payment: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const isPending =
    transaction.workStatus === "PENDING" ||
    transaction.workStatus === "PARTIALLY_RETURNED";

  const remainingPieces = Math.max(
    0,
    transaction.totalGivenPieces -
      (transaction.totalReturnedPieces + transaction.totalDamagedPieces)
  );

  const totalPaidAllocated = transaction.paymentAllocations.reduce(
    (sum, a) => sum + Number(a.allocatedAmount),
    0
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/work"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Work Order Details
            </h1>
            <p className="text-xs text-slate-500">
              Order #{transaction.id.slice(-6).toUpperCase()} • Issued on{" "}
              {formatDate(transaction.issueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/work/${transaction.id}/edit`}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Order</span>
          </Link>

          {isPending && (
            <Link
              href={`/work/${transaction.id}/return`}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Return (Lenvanu)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
        {/* Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                transaction.workStatus === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800"
                  : transaction.workStatus === "PARTIALLY_RETURNED"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {transaction.workStatus.replace("_", " ")}
            </span>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                transaction.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : transaction.paymentStatus === "PARTIALLY_PAID"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {transaction.paymentStatus.replace("_", " ")}
            </span>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            <span>Issued: {formatDate(transaction.issueDate)}</span>
            {transaction.returnDate && (
              <span className="ml-2">• Returned: {formatDate(transaction.returnDate)}</span>
            )}
          </div>
        </div>

        {/* Worker & Design Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Worker / Karigar
            </span>
            <Link
              href={`/customers/${transaction.customer.id}`}
              className="text-base font-extrabold text-blue-600 hover:underline block"
            >
              {transaction.customer.name}
            </Link>
            {transaction.customer.phoneNumber && (
              <p className="text-xs text-slate-600 font-mono">
                📞 {transaction.customer.phoneNumber}
              </p>
            )}
            {transaction.customer.address && (
              <p className="text-xs text-slate-400">📍 {transaction.customer.address}</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Design & Work Specs
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-black text-sm font-mono">
              <Hash className="w-3.5 h-3.5" />
              {transaction.designNumberSnapshot}
            </span>
            <div className="text-xs text-slate-600 font-semibold pt-1">
              {transaction.categorySnapshot} • {transaction.cuttingStyleSnapshot}
            </div>
          </div>
        </div>

        {/* Color-wise Calculation Details */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Color Variations & Calculation Breakdown ({transaction.colorRows.length}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transaction.colorRows.map((r) => {
              const swatch = getColorSwatch(r.colorNameSnapshot);
              const rowRemaining =
                r.givenPieces - (r.returnedPieces + r.damagedPieces);

              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{
                          backgroundColor: swatch.bg,
                          borderColor: swatch.border,
                        }}
                      />
                      <span className="font-bold text-slate-900">
                        {r.colorNameSnapshot}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(Number(r.amount))}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    {r.heads} heads × {r.piecesPerHead} ={" "}
                    <strong className="text-slate-900">{r.givenPieces} given pcs</strong> @ ₹
                    {Number(r.rate).toFixed(2)}/pc
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-mono">
                    <span className="text-emerald-700 font-bold">
                      Returned: {r.returnedPieces}
                    </span>
                    <span className="text-red-600">Damaged: {r.damagedPieces}</span>
                    <span className="text-amber-700 font-bold">
                      Outside: {rowRemaining}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Piece Totals Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">
              Total Given
            </span>
            <span className="text-xl font-black text-blue-900 mt-0.5 block">
              {formatNumber(transaction.totalGivenPieces)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">
              Returned
            </span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">
              {formatNumber(transaction.totalReturnedPieces)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <span className="text-[10px] font-bold text-red-700 uppercase block">
              Damaged
            </span>
            <span className="text-xl font-black text-red-900 mt-0.5 block">
              {formatNumber(transaction.totalDamagedPieces)}
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              remainingPieces > 0
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-slate-50 border-slate-100 text-slate-500"
            }`}
          >
            <span className="text-[10px] font-bold uppercase block">
              Remaining Outside
            </span>
            <span className="text-xl font-black mt-0.5 block">
              {formatNumber(remainingPieces)}
            </span>
          </div>
        </div>

        {/* Financial Settlement Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-300 block">
              Total Order Billing Value:
            </span>
            <span className="text-xs text-slate-400">
              Paid / Allocated: {formatCurrency(totalPaidAllocated)}
            </span>
          </div>
          <div className="text-right font-mono">
            <span className="text-2xl font-black text-emerald-400 block">
              {formatCurrency(Number(transaction.totalAmount))}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Status: {transaction.paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
