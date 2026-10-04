import Link from "next/link";
import {
  Scissors,
  Users,
  Hash,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Database,
  IndianRupee,
  Layers,
  Calendar,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { getColorSwatch } from "@/lib/color-utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Devanu-Lenvanu Piece & Work Register",
  description: "Textile and garment cutting job-work ledger for Surat, Gujarat.",
};

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  // Parallel database queries for real-time KPIs
  const [
    activeWorkersCount,
    totalWorkersCount,
    totalDesignsCount,
    todayIssues,
    allPendingOrders,
    allTransactions,
    allPayments,
    recentTransactions,
    recentPayments,
  ] = await Promise.all([
    prisma.customer.count({
      where: {
        isActive: true,
        transactions: {
          some: {
            workStatus: { in: ["PENDING", "PARTIALLY_RETURNED"] },
          },
        },
      },
    }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.designNumberMaster.count({ where: { isActive: true } }),
    prisma.workTransaction.findMany({
      where: {
        issueDate: { gte: today },
      },
      select: {
        totalGivenPieces: true,
      },
    }),
    prisma.workTransaction.findMany({
      where: {
        workStatus: { in: ["PENDING", "PARTIALLY_RETURNED"] },
      },
      select: {
        id: true,
        totalGivenPieces: true,
        totalReturnedPieces: true,
        totalDamagedPieces: true,
      },
    }),
    prisma.workTransaction.findMany({
      select: {
        id: true,
        issueDate: true,
        totalAmount: true,
        workStatus: true,
      },
    }),
    prisma.payment.findMany({
      select: {
        id: true,
        paymentDate: true,
        paymentAmount: true,
      },
    }),
    prisma.workTransaction.findMany({
      take: 6,
      orderBy: { issueDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        colorRows: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.payment.findMany({
      take: 4,
      orderBy: { paymentDate: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        allocations: {
          select: { id: true },
        },
      },
    }),
  ]);

  // Today's pieces
  const todayPiecesIssued = todayIssues.reduce(
    (sum, tx) => sum + tx.totalGivenPieces,
    0
  );

  // Outside pieces
  const totalOutsidePieces = allPendingOrders.reduce(
    (sum, tx) =>
      sum + (tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces)),
    0
  );

  // Global Financials
  const totalPayableLifetime = allTransactions.reduce(
    (sum, tx) => sum + Number(tx.totalAmount),
    0
  );
  const totalPaidLifetime = allPayments.reduce(
    (sum, p) => sum + Number(p.paymentAmount),
    0
  );
  const outstandingLifetime = Math.max(0, totalPayableLifetime - totalPaidLifetime);

  // Current Month Financials
  const monthTransactions = allTransactions.filter((tx) => {
    const d = new Date(tx.issueDate);
    return d >= startOfMonth && d <= endOfMonth;
  });
  const monthPayments = allPayments.filter((p) => {
    const d = new Date(p.paymentDate);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const monthBilling = monthTransactions.reduce(
    (sum, tx) => sum + Number(tx.totalAmount),
    0
  );
  const monthPaid = monthPayments.reduce(
    (sum, p) => sum + Number(p.paymentAmount),
    0
  );
  const monthDue = Math.max(0, monthBilling - monthPaid);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Welcome & Fast Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 sm:p-7 rounded-3xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100 font-bold text-[11px] uppercase tracking-wider backdrop-blur-xs">
              Surat Cutting Register
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Devanu-Lenvanu Ledger
          </h1>
          <p className="text-blue-100/90 text-xs sm:text-sm font-medium">
            Real-time color-wise piece calculation, return reconciliation & worker payouts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/work/new"
            className="flex-1 sm:flex-initial min-h-[46px] px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Issue Work (Devanu)</span>
          </Link>

          <Link
            href="/payments/new"
            className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Pay Worker</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Active Workers */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              Active Workers
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight leading-none">
              {activeWorkersCount}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              {totalWorkersCount} registered
            </p>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-blue-500 rounded-full" />
        </div>

        {/* Card 2: Today's Issue */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-wider truncate">
              Today Issued
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-black text-indigo-700 font-mono tracking-tight leading-none">
              {formatNumber(todayPiecesIssued)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Dispatched today</p>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-indigo-500 rounded-full" />
        </div>

        {/* Card 3: Outside Pieces */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider truncate">
              Pieces Outside
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight leading-none">
              {formatNumber(totalOutsidePieces)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              {allPendingOrders.length} pending orders
            </p>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-amber-500 rounded-full" />
        </div>

        {/* Card 4: Outstanding Payment */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider truncate">
              Outstanding
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-3xl font-black text-red-700 font-mono tracking-tight leading-none">
              {formatCurrency(outstandingLifetime)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Unpaid balance due</p>
          </div>
          <div className="h-1 w-6 sm:w-8 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Month Overview Financial Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">
              Current Month Financial Summary ({today.toLocaleString("default", { month: "long" })} {today.getFullYear()})
            </span>
          </div>

          <Link
            href="/reports"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Full Monthly Hisab</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-700/80 font-mono">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Month Gross Billing
            </span>
            <span className="text-lg font-black text-white mt-0.5 block">
              {formatCurrency(monthBilling)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              {monthTransactions.length} order(s) this month
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold block">
              Month Cash Paid
            </span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">
              {formatCurrency(monthPaid)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              {monthPayments.length} payout(s) recorded
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-red-400 uppercase font-semibold block">
              Month Remaining Due
            </span>
            <span className="text-lg font-black text-red-400 mt-0.5 block">
              {formatCurrency(monthDue)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Pending period settlement
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <Link
          href="/work/new"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-blue-300 hover:bg-blue-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Issue Work</span>
          <span className="text-[10px] text-slate-400">New Devanu</span>
        </Link>

        <Link
          href="/work"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Return Work</span>
          <span className="text-[10px] text-slate-400">Lenvanu & Scrap</span>
        </Link>

        <Link
          href="/payments"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Payments</span>
          <span className="text-[10px] text-slate-400">Disbursements</span>
        </Link>

        <Link
          href="/customers"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Workers</span>
          <span className="text-[10px] text-slate-400">Karigar Profiles</span>
        </Link>

        <Link
          href="/design-numbers"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-purple-300 hover:bg-purple-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Hash className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Designs</span>
          <span className="text-[10px] text-slate-400">Master Codes</span>
        </Link>

        <Link
          href="/reports"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-amber-300 hover:bg-amber-50/40 transition-all text-center group shadow-2xs active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900">Reports</span>
          <span className="text-[10px] text-slate-400">Monthly Hisab</span>
        </Link>
      </div>

      {/* 2-Column Section: Recent Work Orders & Recent Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Work Orders */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Recent Work Orders (Devanu)</h2>
            </div>
            <Link
              href="/work"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No work orders recorded yet</p>
              <Link
                href="/work/new"
                className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue First Work Order</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => {
                const isPending =
                  tx.workStatus === "PENDING" || tx.workStatus === "PARTIALLY_RETURNED";
                const remaining =
                  tx.totalGivenPieces - (tx.totalReturnedPieces + tx.totalDamagedPieces);

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/customers/${tx.customer.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 text-sm"
                        >
                          {tx.customer.name}
                        </Link>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black font-mono text-[11px]">
                          <Hash className="w-3 h-3" />
                          {tx.designNumberSnapshot}
                        </span>
                        {tx.categorySnapshot && (
                          <span className="text-[11px] text-slate-600 font-medium">
                            {tx.categorySnapshot}
                          </span>
                        )}
                      </div>

                      {/* Color rows chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.colorRows.map((r) => (
                          <span
                            key={r.id}
                            className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-semibold"
                          >
                            {r.colorNameSnapshot}
                          </span>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>Issued: {formatDate(tx.issueDate)}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <p className="font-bold text-slate-900 text-xs">
                          {formatNumber(tx.totalGivenPieces)} pcs
                        </p>
                        <p className="font-black text-emerald-700 text-xs">
                          {formatCurrency(Number(tx.totalAmount))}
                        </p>
                      </div>

                      {isPending ? (
                        <Link
                          href={`/work/${tx.id}/return`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Return</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Payment Settlements */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Recent Settlements</h2>
            </div>
            <Link
              href="/payments"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No payouts recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <div key={p.id} className="p-3.5 hover:bg-slate-50/70 transition-colors space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.customer.name}</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {formatCurrency(Number(p.paymentAmount))}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Period: {formatDate(p.fromDate)} &rarr; {formatDate(p.toDate)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Paid on {formatDate(p.paymentDate)} • {p.allocations.length} order(s) settled
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
