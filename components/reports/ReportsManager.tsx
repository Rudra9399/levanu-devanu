"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Users,
  Hash,
  IndianRupee,
  Calendar,
  Printer,
  Download,
  Search,
  Layers,
  CheckCircle2,
  FileText,
  User,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { deleteWorkTransactionAction } from "@/lib/actions/transaction-actions";

export interface TransactionReportItem {
  id: string;
  customerId: string;
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
  colorRows: Array<{
    id: string;
    colorNameSnapshot: string;
    heads: number;
    piecesPerHead: number;
    givenPieces: number;
    returnedPieces: number;
    damagedPieces: number;
    rate: any;
    amount: any;
  }>;
  paymentAllocations: Array<{
    allocatedAmount: any;
  }>;
}

export interface PaymentReportItem {
  id: string;
  customerId: string;
  fromDate: Date | string;
  toDate: Date | string;
  paymentDate: Date | string;
  paymentAmount: any;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phoneNumber?: string | null;
  };
  allocations: Array<{
    allocatedAmount: any;
    workTransaction: {
      designNumberSnapshot: string;
      categorySnapshot: string | null;
    };
  }>;
}

interface ReportsManagerProps {
  transactions: TransactionReportItem[];
  payments: PaymentReportItem[];
  workers: Array<{ id: string; name: string; phoneNumber?: string | null }>;
}

const PAGE_SIZE = 8;

export function ReportsManager({
  transactions,
  payments,
  workers,
}: ReportsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "monthly" | "worker" | "design" | "payment"
  >("monthly");

  // Date filters
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [customFromDate, setCustomFromDate] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return d.toISOString().split("T")[0];
  });
  const [customToDate, setCustomToDate] = useState(
    () => today.toISOString().split("T")[0]
  );

  // Filters
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const YEARS = [2024, 2025, 2026, 2027, 2028];

  // 1. MONTHLY HISAB
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.issueDate);
      const inMonth =
        d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      if (!inMonth) return false;

      if (selectedWorkerId && tx.customerId !== selectedWorkerId) return false;

      if (search) {
        const q = search.toLowerCase().trim();
        const matches =
          tx.customer.name.toLowerCase().includes(q) ||
          tx.designNumberSnapshot.toLowerCase().includes(q) ||
          (tx.categorySnapshot &&
            tx.categorySnapshot.toLowerCase().includes(q)) ||
          (tx.customer.phoneNumber && tx.customer.phoneNumber.includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedYear, selectedWorkerId, search]);

  const monthlyTotals = useMemo(() => {
    let given = 0;
    let returned = 0;
    let damaged = 0;
    let billing = 0;
    let paid = 0;

    monthlyTransactions.forEach((tx) => {
      given += tx.totalGivenPieces;
      returned += tx.totalReturnedPieces;
      damaged += tx.totalDamagedPieces;
      billing += Number(tx.totalAmount);
      const allocated = tx.paymentAllocations.reduce(
        (sum, a) => sum + Number(a.allocatedAmount),
        0
      );
      paid += allocated;
    });

    const outstanding = Math.max(0, billing - paid);
    const outsidePieces = Math.max(0, given - (returned + damaged));

    return {
      totalOrders: monthlyTransactions.length,
      given,
      returned,
      damaged,
      outsidePieces,
      billing: Number(billing.toFixed(2)),
      paid: Number(paid.toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
    };
  }, [monthlyTransactions]);

  // 2. WORKER REPORT
  const workerReportData = useMemo(() => {
    const from = new Date(customFromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customToDate);
    to.setHours(23, 59, 59, 999);

    const map = new Map<
      string,
      {
        workerId: string;
        workerName: string;
        phoneNumber: string | null;
        totalOrders: number;
        givenPieces: number;
        returnedPieces: number;
        damagedPieces: number;
        totalPayable: number;
        totalPaid: number;
      }
    >();

    workers.forEach((w) => {
      if (!selectedWorkerId || w.id === selectedWorkerId) {
        map.set(w.id, {
          workerId: w.id,
          workerName: w.name,
          phoneNumber: w.phoneNumber || null,
          totalOrders: 0,
          givenPieces: 0,
          returnedPieces: 0,
          damagedPieces: 0,
          totalPayable: 0,
          totalPaid: 0,
        });
      }
    });

    transactions.forEach((tx) => {
      const issueD = new Date(tx.issueDate);
      if (issueD >= from && issueD <= to) {
        if (!selectedWorkerId || tx.customerId === selectedWorkerId) {
          let entry = map.get(tx.customerId);
          if (!entry) {
            entry = {
              workerId: tx.customerId,
              workerName: tx.customer.name,
              phoneNumber: tx.customer.phoneNumber || null,
              totalOrders: 0,
              givenPieces: 0,
              returnedPieces: 0,
              damagedPieces: 0,
              totalPayable: 0,
              totalPaid: 0,
            };
            map.set(tx.customerId, entry);
          }

          entry.totalOrders += 1;
          entry.givenPieces += tx.totalGivenPieces;
          entry.returnedPieces += tx.totalReturnedPieces;
          entry.damagedPieces += tx.totalDamagedPieces;
          entry.totalPayable += Number(tx.totalAmount);
        }
      }
    });

    payments.forEach((p) => {
      const payD = new Date(p.paymentDate);
      if (payD >= from && payD <= to) {
        if (!selectedWorkerId || p.customerId === selectedWorkerId) {
          const entry = map.get(p.customerId);
          if (entry) {
            entry.totalPaid += Number(p.paymentAmount);
          }
        }
      }
    });

    const rows = Array.from(map.values()).map((r) => ({
      ...r,
      outsidePieces: Math.max(
        0,
        r.givenPieces - (r.returnedPieces + r.damagedPieces)
      ),
      outstanding: Number((r.totalPayable - r.totalPaid).toFixed(2)),
    }));

    if (search) {
      const q = search.toLowerCase().trim();
      return rows.filter((r) => r.workerName.toLowerCase().includes(q));
    }

    return rows.sort((a, b) => b.totalPayable - a.totalPayable);
  }, [
    transactions,
    payments,
    workers,
    customFromDate,
    customToDate,
    selectedWorkerId,
    search,
  ]);

  // 3. DESIGN REPORT
  const designReportData = useMemo(() => {
    const from = new Date(customFromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customToDate);
    to.setHours(23, 59, 59, 999);

    const map = new Map<
      string,
      {
        designNumber: string;
        categories: Set<string>;
        totalOrders: number;
        givenPieces: number;
        returnedPieces: number;
        damagedPieces: number;
        totalAmount: number;
      }
    >();

    transactions.forEach((tx) => {
      const issueD = new Date(tx.issueDate);
      if (issueD >= from && issueD <= to) {
        if (!selectedWorkerId || tx.customerId === selectedWorkerId) {
          const key = tx.designNumberSnapshot;
          let entry = map.get(key);
          if (!entry) {
            entry = {
              designNumber: key,
              categories: new Set(),
              totalOrders: 0,
              givenPieces: 0,
              returnedPieces: 0,
              damagedPieces: 0,
              totalAmount: 0,
            };
            map.set(key, entry);
          }

          if (tx.categorySnapshot) entry.categories.add(tx.categorySnapshot);
          entry.totalOrders += 1;
          entry.givenPieces += tx.totalGivenPieces;
          entry.returnedPieces += tx.totalReturnedPieces;
          entry.damagedPieces += tx.totalDamagedPieces;
          entry.totalAmount += Number(tx.totalAmount);
        }
      }
    });

    const rows = Array.from(map.values()).map((r) => ({
      designNumber: r.designNumber,
      categories: Array.from(r.categories).join(", ") || "General",
      totalOrders: r.totalOrders,
      givenPieces: r.givenPieces,
      returnedPieces: r.returnedPieces,
      damagedPieces: r.damagedPieces,
      outsidePieces: Math.max(
        0,
        r.givenPieces - (r.returnedPieces + r.damagedPieces)
      ),
      totalAmount: Number(r.totalAmount.toFixed(2)),
    }));

    if (search) {
      const q = search.toLowerCase().trim();
      return rows.filter(
        (r) =>
          r.designNumber.toLowerCase().includes(q) ||
          r.categories.toLowerCase().includes(q)
      );
    }

    return rows.sort((a, b) => b.givenPieces - a.givenPieces);
  }, [transactions, customFromDate, customToDate, selectedWorkerId, search]);

  // 4. PAYMENT REPORT
  const paymentReportData = useMemo(() => {
    const from = new Date(customFromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customToDate);
    to.setHours(23, 59, 59, 999);

    return payments.filter((p) => {
      const payD = new Date(p.paymentDate);
      if (payD < from || payD > to) return false;
      if (selectedWorkerId && p.customerId !== selectedWorkerId) return false;

      if (search) {
        const q = search.toLowerCase().trim();
        return (
          p.customer.name.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, customFromDate, customToDate, selectedWorkerId, search]);

  // Active records for pagination
  const activeRecords = useMemo(() => {
    if (activeTab === "monthly") return monthlyTransactions;
    if (activeTab === "worker") return workerReportData;
    if (activeTab === "design") return designReportData;
    return paymentReportData;
  }, [
    activeTab,
    monthlyTransactions,
    workerReportData,
    designReportData,
    paymentReportData,
  ]);

  const totalPages = Math.ceil(activeRecords.length / PAGE_SIZE) || 1;
  const paginatedMonthly = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return monthlyTransactions.slice(start, start + PAGE_SIZE);
  }, [monthlyTransactions, currentPage]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "";
    let filename = `report_${activeTab}_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    if (activeTab === "monthly") {
      csvContent =
        "Issue Date,Worker,Phone,Design,Category,Given Pcs,Returned Pcs,Damaged Pcs,Amount,Status,Payment\n";
      monthlyTransactions.forEach((tx) => {
        csvContent += `"${formatDate(tx.issueDate)}","${tx.customer.name}","${
          tx.customer.phoneNumber || ""
        }","${tx.designNumberSnapshot}","${tx.categorySnapshot || ""}",${
          tx.totalGivenPieces
        },${tx.totalReturnedPieces},${tx.totalDamagedPieces},${
          tx.totalAmount
        },"${tx.workStatus}","${tx.paymentStatus}"\n`;
      });
    } else if (activeTab === "worker") {
      csvContent =
        "Worker,Phone,Total Orders,Given Pcs,Returned Pcs,Damaged Pcs,Outside Pcs,Payable,Paid,Outstanding\n";
      workerReportData.forEach((w) => {
        csvContent += `"${w.workerName}","${w.phoneNumber || ""}",${
          w.totalOrders
        },${w.givenPieces},${w.returnedPieces},${w.damagedPieces},${
          w.outsidePieces
        },${w.totalPayable},${w.totalPaid},${w.outstanding}\n`;
      });
    } else if (activeTab === "design") {
      csvContent =
        "Design Number,Categories,Batches,Given Pcs,Returned Pcs,Damaged Pcs,Outside Pcs,Gross Amount\n";
      designReportData.forEach((d) => {
        csvContent += `"${d.designNumber}","${d.categories}",${d.totalOrders},${
          d.givenPieces
        },${d.returnedPieces},${d.damagedPieces},${d.outsidePieces},${
          d.totalAmount
        }\n`;
      });
    } else {
      csvContent =
        "Payment Date,Worker,From Date,To Date,Amount,Allocated Orders,Notes\n";
      paymentReportData.forEach((p) => {
        csvContent += `"${formatDate(p.paymentDate)}","${
          p.customer.name
        }","${formatDate(p.fromDate)}","${formatDate(p.toDate)}",${
          p.paymentAmount
        },${p.allocations.length},"${p.notes || ""}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report CSV exported successfully!");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete work order for ${name}?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteWorkTransactionAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete");
      } else {
        toast.success("Order deleted successfully");
        router.refresh();
      }
    } catch {
      toast.error("Error deleting order");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Reports & Financial Hisab
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Multi-dimensional analysis for Surat textile job-work calculations
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Report Navigation Tabs (Smooth horizontal scrolling on mobile, full width on desktop) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto no-scrollbar print:hidden">
        <button
          onClick={() => {
            setActiveTab("monthly");
            setCurrentPage(1);
          }}
          className={`shrink-0 sm:flex-1 whitespace-nowrap py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Monthly Hisab</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("worker");
            setCurrentPage(1);
          }}
          className={`shrink-0 sm:flex-1 whitespace-nowrap py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTab === "worker"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Worker Report</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("design");
            setCurrentPage(1);
          }}
          className={`shrink-0 sm:flex-1 whitespace-nowrap py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTab === "design"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Design Report</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("payment");
            setCurrentPage(1);
          }}
          className={`shrink-0 sm:flex-1 whitespace-nowrap py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTab === "payment"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Payment Report</span>
        </button>
      </div>

      {/* Filter Toolbar Card (Organized into responsive 2-column mobile rows) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5 sm:gap-3">
          {/* Main search bar */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search Report
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search worker, design number..."
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
          </div>

          {/* Sub-Filters Grid: 2-column on mobile, inline on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-end gap-2 sm:gap-3">
            {activeTab === "monthly" ? (
              <>
                {/* Month Dropdown */}
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Month
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full pl-7 pr-2 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Year Dropdown */}
                <div className="w-full sm:w-28">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Year
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full pl-7 pr-2 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden font-mono"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              /* Custom Date Range for Worker / Design / Payment Tabs */
              <>
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => {
                      setCustomFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => {
                      setCustomToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </>
            )}

            {/* Worker Filter Dropdown */}
            <div className="col-span-2 sm:col-span-1 w-full sm:w-44">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Worker
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedWorkerId}
                  onChange={(e) => {
                    setSelectedWorkerId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-7 pr-2 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-hidden"
                >
                  <option value="">All Workers</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MONTHLY HISAB TAB CONTENT */}
      {/* ========================================================= */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* 4 Summary Metric Cards (2 per row on mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* Card 1: TOTAL GIVEN PIECES */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Given Pieces
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none font-mono">
                    {formatNumber(monthlyTotals.given)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                    {monthlyTotals.totalOrders} order(s) issued
                  </p>
                </div>
              </div>
              <div className="h-1 w-6 sm:w-8 bg-blue-500 rounded-full mt-2.5" />
            </div>

            {/* Card 2: RETURNED PIECES */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 truncate">
                    Returned Pieces
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none font-mono">
                    {formatNumber(monthlyTotals.returned)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                    {monthlyTotals.damaged > 0
                      ? `${monthlyTotals.damaged} damaged`
                      : "0 damaged"}
                  </p>
                </div>
              </div>
              <div className="h-1 w-6 sm:w-8 bg-emerald-500 rounded-full mt-2.5" />
            </div>

            {/* Card 3: GROSS BILLING (₹) */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 truncate">
                    Gross Billing
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-black text-indigo-600 tracking-tight leading-none font-mono">
                    {formatCurrency(monthlyTotals.billing)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                    Paid: {formatCurrency(monthlyTotals.paid)}
                  </p>
                </div>
              </div>
              <div className="h-1 w-6 sm:w-8 bg-purple-500 rounded-full mt-2.5" />
            </div>

            {/* Card 4: BALANCE DUE (₹) */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs relative flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 truncate">
                    Balance Due
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-black text-rose-600 tracking-tight leading-none font-mono">
                    {formatCurrency(monthlyTotals.outstanding)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
                    {monthlyTotals.outsidePieces} pcs outside
                  </p>
                </div>
              </div>
              <div className="h-1 w-6 sm:w-8 bg-rose-500 rounded-full mt-2.5" />
            </div>
          </div>

          {/* High-Density Monthly Hisab Table */}
          {paginatedMonthly.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                No orders recorded for this month
              </p>
              <p className="text-xs text-slate-400">
                Try selecting another month/year or reset the worker filter.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">DESIGN / TYPE</th>
                      <th className="py-3 px-4">ISSUE DATE</th>
                      <th className="py-3 px-4">WORKER</th>
                      <th className="py-3 px-4 text-center">GIVEN</th>
                      <th className="py-3 px-4 text-center">RETURNED</th>
                      <th className="py-3 px-4 text-right">AMOUNT (₹)</th>
                      <th className="py-3 px-4 text-center">WORK STATUS</th>
                      <th className="py-3 px-4 text-center">PAYMENT</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedMonthly.map((tx) => {
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          {/* DESIGN / TYPE (First Column) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 font-bold text-xs font-mono">
                                #{tx.designNumberSnapshot}
                              </span>
                              {tx.categorySnapshot && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                  {tx.categorySnapshot}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ISSUE DATE */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                            {formatDate(tx.issueDate)}
                          </td>

                          {/* WORKER */}
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

                          {/* GIVEN */}
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-900">
                            {formatNumber(tx.totalGivenPieces)}
                          </td>

                          {/* RETURNED */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                            {formatNumber(tx.totalReturnedPieces)}
                          </td>

                          {/* AMOUNT */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(Number(tx.totalAmount))}
                          </td>

                          {/* WORK STATUS */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {tx.workStatus === "COMPLETED" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                COMPLETED
                              </span>
                            ) : tx.workStatus === "PARTIALLY_RETURNED" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                                PARTIAL
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* PAYMENT */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {tx.paymentStatus === "PAID" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                PAID
                              </span>
                            ) : tx.paymentStatus === "PARTIALLY_PAID" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[11px] font-bold">
                                PARTIAL
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold">
                                UNPAID
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/work/${tx.id}/return`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                title="View & Return Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/work/${tx.id}`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                                title="Edit Order"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                disabled={deletingId === tx.id}
                                onClick={() =>
                                  handleDelete(tx.id, tx.customer.name)
                                }
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
                      monthlyTransactions.length
                    )}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      currentPage * PAGE_SIZE,
                      monthlyTransactions.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {monthlyTransactions.length}
                  </span>{" "}
                  record{monthlyTransactions.length === 1 ? "" : "s"}
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
      )}

      {/* ========================================================= */}
      {/* 2. WORKER REPORT TAB CONTENT */}
      {/* ========================================================= */}
      {activeTab === "worker" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4 text-center">Total Orders</th>
                  <th className="py-3 px-4 text-center">Given (pcs)</th>
                  <th className="py-3 px-4 text-center">Returned (pcs)</th>
                  <th className="py-3 px-4 text-center">Outside (pcs)</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right print:hidden">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {workerReportData.map((w) => (
                  <tr
                    key={w.workerId}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{w.workerName}</p>
                      {w.phoneNumber && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          {w.phoneNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {w.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {formatNumber(w.givenPieces)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-600 font-bold">
                      {formatNumber(w.returnedPieces)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {w.outsidePieces > 0 ? (
                        <span className="text-amber-700 font-bold">
                          {formatNumber(w.outsidePieces)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(w.totalPayable)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                      {formatCurrency(w.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black">
                      <span
                        className={
                          w.outstanding > 0 ? "text-red-600" : "text-emerald-600"
                        }
                      >
                        {formatCurrency(w.outstanding)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right print:hidden">
                      <Link
                        href={`/customers/${w.workerId}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors inline-block"
                        title="View Ledger Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DESIGN REPORT TAB CONTENT */}
      {/* ========================================================= */}
      {activeTab === "design" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Design Number</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4 text-center">Total Batches</th>
                  <th className="py-3 px-4 text-center">Given Pieces</th>
                  <th className="py-3 px-4 text-center">Returned Pieces</th>
                  <th className="py-3 px-4 text-center">Outside Pieces</th>
                  <th className="py-3 px-4 text-right">Gross Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {designReportData.map((d) => (
                  <tr
                    key={d.designNumber}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 font-bold text-xs font-mono">
                        #{d.designNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {d.categories}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {d.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-900">
                      {formatNumber(d.givenPieces)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                      {formatNumber(d.returnedPieces)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {d.outsidePieces > 0 ? (
                        <span className="text-amber-700 font-bold">
                          {formatNumber(d.outsidePieces)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(d.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PAYMENT REPORT TAB CONTENT */}
      {/* ========================================================= */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Period Range</th>
                  <th className="py-3 px-4 text-right">Amount Disbursed</th>
                  <th className="py-3 px-4 text-center">Allocated Orders</th>
                  <th className="py-3 px-4">Mode / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paymentReportData.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/customers/${p.customer.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 block"
                      >
                        {p.customer.name}
                      </Link>
                      {p.customer.phoneNumber && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.customer.phoneNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {formatDate(p.fromDate)} &rarr; {formatDate(p.toDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-600 whitespace-nowrap">
                      {formatCurrency(Number(p.paymentAmount))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs font-mono">
                        {p.allocations.length} orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                      {p.notes || "Cash"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
