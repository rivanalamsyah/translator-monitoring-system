import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Trophy,
  Download,
  Printer,
  Search,
  Calendar,
  Languages,
} from 'lucide-react';
import { formatClock, formatDate } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { translators, assignments } = useApp();

  const [activeReport, setActiveReport] = useState<'task' | 'translator' | 'productivity' | 'worktime' | 'points'>('task');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'30days' | '7days' | 'all'>('30days');

  // Filter tasks based on date range (simulated)
  const filteredTasks = useMemo(() => {
    return assignments.filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.translatorName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchSearch) return false;

      if (dateRange === 'all') return true;
      const createdDate = new Date(task.createdAt || Date.now());
      const now = new Date();
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      
      if (dateRange === '7days') return diffDays <= 7;
      return diffDays <= 30; // default 30 days
    });
  }, [assignments, searchQuery, dateRange]);

  // Grouped productivity stats (completed tasks grouped by date)
  const productivityData = useMemo(() => {
    const groups: Record<string, { date: string; count: number; pages: number; points: number }> = {};
    
    filteredTasks
      .filter((t) => t.status === 'COMPLETED')
      .forEach((t) => {
        const dateStr = t.completedAt ? new Date(t.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
        if (!groups[dateStr]) {
          groups[dateStr] = { date: dateStr, count: 0, pages: 0, points: 0 };
        }
        groups[dateStr].count += 1;
        groups[dateStr].pages += t.pageCount || 0;
        groups[dateStr].points += t.calculatedPoints || 0;
      });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTasks]);

  // Stats calculation
  const totalPages = useMemo(() => {
    return assignments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((acc, curr) => acc + curr.pageCount, 0);
  }, [assignments]);

  const totalPoints = useMemo(() => {
    return assignments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((acc, curr) => acc + curr.calculatedPoints, 0);
  }, [assignments]);

  const avgWorkSecsPerPage = useMemo(() => {
    const completed = assignments.filter((a) => a.status === 'COMPLETED' && a.totalWorkingSeconds > 0);
    if (completed.length === 0) return 0;
    const totalSecs = completed.reduce((acc, a) => acc + a.totalWorkingSeconds, 0);
    const totalPgs = completed.reduce((acc, a) => acc + a.pageCount, 0);
    return totalPgs > 0 ? Math.round(totalSecs / totalPgs) : 0;
  }, [assignments]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `laporan_${activeReport}_${Date.now()}.csv`;

    if (activeReport === 'task') {
      headers = ['Kode', 'Judul Dokumen', 'Klien', 'Penerjemah', 'Jumlah Halaman', 'Reward Poin', 'Waktu Kerja (Detik)', 'Status', 'Tanggal Mulai', 'Tanggal Selesai'];
      rows = filteredTasks.map((t) => [
        t.code,
        t.title,
        t.clientName,
        t.translatorName || 'Belum Diklaim',
        t.pageCount,
        t.calculatedPoints,
        t.totalWorkingSeconds || 0,
        t.status,
        t.startedAt ? formatDate(t.startedAt) : '-',
        t.completedAt ? formatDate(t.completedAt) : '-',
      ]);
    } else if (activeReport === 'translator') {
      headers = ['Nama Penerjemah', 'Status Ketersediaan', 'Bahasa', 'Total Tugas Selesai', 'Beban Kapasitas Saat Ini (hlm)', 'Maks Kapasitas (hlm)', 'Rasio Utilisasi (%)'];
      rows = translators.map((t) => [
        t.name,
        t.status,
        t.languages.join('; '),
        t.completedJobsCount,
        t.currentLoadPoints,
        t.maxCapacityPoints,
        t.utilizationPercentage,
      ]);
    } else if (activeReport === 'productivity') {
      headers = ['Tanggal Penyelesaian', 'Jumlah Tugas Selesai', 'Total Halaman Selesai', 'Total Poin Terkumpul'];
      rows = productivityData.map((d) => [d.date, d.count, d.pages, d.points]);
    } else if (activeReport === 'worktime') {
      headers = ['Kode Tugas', 'Judul Tugas', 'Penerjemah', 'Jumlah Halaman', 'Total Kerja (detik)', 'Total Jeda (detik)', 'Rerata Detik Per Halaman'];
      rows = filteredTasks
        .filter((t) => t.status === 'COMPLETED')
        .map((t) => [
          t.code,
          t.title,
          t.translatorName || '-',
          t.pageCount,
          t.totalWorkingSeconds || 0,
          t.totalIdleSeconds || 0,
          t.pageCount > 0 ? Math.round((t.totalWorkingSeconds || 0) / t.pageCount) : 0,
        ]);
    } else if (activeReport === 'points') {
      headers = ['Nama Penerjemah', 'Level', 'Poin Leaderboard', 'Total Tugas Selesai'];
      rows = translators.map((t) => [
        t.name,
        t.level || 1,
        t.points || 0,
        t.completedJobsCount,
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${('' + val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8 print-container">
      
      {/* Dynamic Inline CSS for Print Optimization */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, footer, .no-print, button, select, input {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-header-only {
            display: block !important;
          }
          .print-container {
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px !important;
            text-align: left !important;
          }
        }
        .print-header-only {
          display: none;
        }
      `}</style>

      {/* Simulated Print Only Header */}
      <div className="print-header-only border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wider">
          Laporan Operasional TMS - Master Translate
        </h1>
        <p className="text-xs text-center text-slate-400 mt-1">
          Tanggal Unduh: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Diunduh Oleh: Admin Panel
        </p>
      </div>

      {/* Header (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-pink-600" />
            <span>Laporan Operasional & Kinerja Penerjemah</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor data kinerja tugas, beban utilisasi penerjemah, waktu kerja efektif, dan akumulasi poin.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-md shadow-pink-600/10 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Volume Terjemahan</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalPages} hlm</p>
          <p className="text-[10px] text-slate-400">Total halaman dokumen disetujui</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Reward Poin</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalPoints} pt</p>
          <p className="text-[10px] text-slate-400">Poin terkumpul di leaderboard</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Kecepatan Rata-rata</p>
          <p className="text-2xl font-black text-slate-800 font-mono">
            {avgWorkSecsPerPage > 0 ? `${Math.round(avgWorkSecsPerPage / 60)}` : '0'} mnt / hlm
          </p>
          <p className="text-[10px] text-slate-400">Waktu kerja efektif per halaman</p>
        </div>
      </div>

      {/* Report Selector (Sub-tabs) - Screen Only */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 no-print">
        <button
          onClick={() => setActiveReport('task')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeReport === 'task' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Laporan Tugas</span>
        </button>
        <button
          onClick={() => setActiveReport('translator')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeReport === 'translator' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Laporan Penerjemah</span>
        </button>
        <button
          onClick={() => setActiveReport('productivity')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeReport === 'productivity' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Produktivitas</span>
        </button>
        <button
          onClick={() => setActiveReport('worktime')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeReport === 'worktime' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Waktu Kerja</span>
        </button>
        <button
          onClick={() => setActiveReport('points')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeReport === 'points' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Poin & Leaderboard</span>
        </button>
      </div>

      {/* Filter panel - Screen Only */}
      <div className="flex flex-col sm:flex-row gap-3 items-center no-print">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-805 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
          >
            <option value="30days">30 Hari Terakhir</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
      </div>

      {/* Render Dynamic Report Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {activeReport === 'task' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Kode & Judul Tugas</th>
                  <th className="py-3.5 px-3">Klien</th>
                  <th className="py-3.5 px-3">Penerjemah</th>
                  <th className="py-3.5 px-3 text-center">Halaman</th>
                  <th className="py-3.5 px-3 text-center">Poin</th>
                  <th className="py-3.5 px-3">Durasi Kerja</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Tanggal Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-slate-400">Tidak ada data tugas.</td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <span className="font-mono text-[10px] font-bold text-pink-600 block">{t.code}</span>
                        <span className="truncate max-w-[200px] block">{t.title}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{t.clientName}</td>
                      <td className="py-3.5 px-3 font-semibold">{t.translatorName || 'Belum Diklaim'}</td>
                      <td className="py-3.5 px-3 text-center font-mono">{t.pageCount} hlm</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-pink-600">{t.calculatedPoints} pt</td>
                      <td className="py-3.5 px-3 font-mono">{formatClock(t.totalWorkingSeconds)}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-100">{t.status}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">{t.completedAt ? new Date(t.completedAt).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'translator' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Nama Penerjemah</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Bahasa</th>
                  <th className="py-3.5 px-3 text-center">Tugas Selesai</th>
                  <th className="py-3.5 px-3 text-center">Beban Aktif</th>
                  <th className="py-3.5 px-3 text-center">Maks Kapasitas</th>
                  <th className="py-3.5 px-3 text-center">Utilisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {translators.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{tr.name}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-500">{tr.status}</td>
                    <td className="py-3.5 px-3 text-slate-655 font-mono">{tr.languages.join(', ')}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.completedJobsCount}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.currentLoadPoints} hlm</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.maxCapacityPoints} hlm</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-pink-600">{tr.utilizationPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'productivity' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-3 text-center">Tugas Selesai</th>
                  <th className="py-3.5 px-3 text-center">Total Halaman Diterjemahkan</th>
                  <th className="py-3.5 px-3 text-center">Total Poin Diperoleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {productivityData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-slate-400">Belum ada tugas diselesaikan pada periode ini.</td>
                  </tr>
                ) : (
                  productivityData.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium">{d.date}</td>
                      <td className="py-3.5 px-3 text-center font-mono">{d.count} tugas</td>
                      <td className="py-3.5 px-3 text-center font-mono">{d.pages} hlm</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-pink-600">{d.points} pt</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'worktime' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Kode & Judul Tugas</th>
                  <th className="py-3.5 px-3">Penerjemah</th>
                  <th className="py-3.5 px-3 text-center">Halaman</th>
                  <th className="py-3.5 px-3">Total Jam Kerja</th>
                  <th className="py-3.5 px-3">Total Sesi Jeda</th>
                  <th className="py-3.5 px-3 text-center">Rata-rata Waktu/Halaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.filter((t) => t.status === 'COMPLETED').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-slate-400">Belum ada data waktu kerja tugas diselesaikan.</td>
                  </tr>
                ) : (
                  filteredTasks
                    .filter((t) => t.status === 'COMPLETED')
                    .map((t) => {
                      const avgSecs = t.pageCount > 0 ? Math.round(t.totalWorkingSeconds / t.pageCount) : 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] font-bold text-pink-600 block">{t.code}</span>
                            <span className="truncate max-w-[200px] block">{t.title}</span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">{t.translatorName || '-'}</td>
                          <td className="py-3.5 px-3 text-center font-mono">{t.pageCount} hlm</td>
                          <td className="py-3.5 px-3 font-mono font-semibold">{formatClock(t.totalWorkingSeconds)}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{formatClock(t.totalIdleSeconds)}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-pink-600">{Math.round(avgSecs / 60)} mnt/hlm</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'points' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Nama Penerjemah</th>
                  <th className="py-3.5 px-3 text-center">Level</th>
                  <th className="py-3.5 px-3 text-center">Total XP</th>
                  <th className="py-3.5 px-3 text-center">Total Poin Leaderboard</th>
                  <th className="py-3.5 px-3 text-center">Jumlah Tugas Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {translators.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{tr.name}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-600">Level {tr.level || 1}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.xp || 0} XP</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-pink-600">{tr.points || 0} pt</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.completedJobsCount} tugas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
