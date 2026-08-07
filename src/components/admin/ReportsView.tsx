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
  Layers
} from 'lucide-react';
import { formatClock, formatDate } from '../../utils/formatters';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export const ReportsView: React.FC = () => {
  const { translators, tasks } = useApp();

  const [activeReport, setActiveReport] = useState<'task' | 'translator' | 'productivity' | 'worktime' | 'points'>('task');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'30days' | '7days' | 'all'>('30days');

  const getExportFilename = (type: 'task' | 'translator' | 'productivity' | 'worktime' | 'points', extension: 'pdf' | 'xlsx') => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    let reportName = 'Laporan';
    if (type === 'task') reportName = 'Laporan_Operasional_Task_Pool';
    else if (type === 'translator') reportName = 'Laporan_Kinerja_dan_Kapasitas_Penerjemah';
    else if (type === 'productivity') reportName = 'Laporan_Produktivitas_Harian';
    else if (type === 'worktime') reportName = 'Laporan_Waktu_Efektif_dan_Jeda_Penerjemah';
    else if (type === 'points') reportName = 'Laporan_Profil_dan_Distribusi_Poin';

    return `${reportName}_${dateStr}.${extension}`;
  };

  // Filter tasks based on date range and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, searchQuery, dateRange]);

  // Productivity stats (completed tasks grouped by date)
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
        groups[dateStr].points += t.rewardPoints || t.calculatedPoints || 0;
      });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTasks]);

  // Statistics calculation for KPIs
  const totalPages = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((acc, curr) => acc + curr.pageCount, 0);
  }, [tasks]);

  const totalPoints = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((acc, curr) => acc + (curr.rewardPoints || curr.calculatedPoints || 0), 0);
  }, [tasks]);

  const avgWorkSecsPerPage = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'COMPLETED' && (t.effectiveWorkSeconds || t.totalWorkingSeconds || 0) > 0);
    if (completed.length === 0) return 0;
    const totalSecs = completed.reduce((acc, t) => acc + (t.effectiveWorkSeconds || t.totalWorkingSeconds || 0), 0);
    const totalPgs = completed.reduce((acc, t) => acc + t.pageCount, 0);
    return totalPgs > 0 ? Math.round(totalSecs / totalPgs) : 0;
  }, [tasks]);

  const handleExportExcel = () => {
    let sheetData: any[] = [];
    const filename = getExportFilename(activeReport, 'xlsx');

    if (activeReport === 'task') {
      sheetData = filteredTasks.map((t) => ({
        Kode: t.code,
        'Judul Dokumen': t.title,
        Klien: t.clientName,
        Penerjemah: t.translatorName || 'Belum Diklaim',
        'Jumlah Halaman': t.pageCount,
        'Reward Poin': t.rewardPoints || t.calculatedPoints,
        'Waktu Kerja (detik)': t.effectiveWorkSeconds || t.totalWorkingSeconds || 0,
        Status: t.status,
        'Tanggal Mulai': t.startedAt ? formatDate(t.startedAt) : '-',
        'Tanggal Selesai': t.completedAt ? formatDate(t.completedAt) : '-'
      }));
    } else if (activeReport === 'translator') {
      sheetData = translators.map((t) => ({
        'Nama Penerjemah': t.name,
        Status: t.status,
        Bahasa: t.languages.join(', '),
        'Tugas Selesai': t.completedJobsCount,
        'Beban Kerja Saat Ini (Hlm)': t.currentLoadPoints,
        'Kapasitas Maksimal (Hlm)': t.maxCapacityPoints,
        'Rasio Utilisasi (%)': `${t.utilizationPercentage}%`
      }));
    } else if (activeReport === 'productivity') {
      sheetData = productivityData.map((d) => ({
        Tanggal: d.date,
        'Jumlah Tugas Selesai': d.count,
        'Total Halaman': d.pages,
        'Poin Didistribusikan': d.points
      }));
    } else if (activeReport === 'worktime') {
      sheetData = filteredTasks
        .filter((t) => t.status === 'COMPLETED')
        .map((t) => ({
          Kode: t.code,
          'Judul Tugas': t.title,
          Penerjemah: t.translatorName || '-',
          Halaman: t.pageCount,
          'Waktu Efektif (Detik)': t.effectiveWorkSeconds || t.totalWorkingSeconds || 0,
          'Total Jeda (Detik)': t.totalPauseDuration || t.totalIdleSeconds || 0,
          'Rerata Detik/Halaman': t.pageCount > 0 ? Math.round((t.effectiveWorkSeconds || t.totalWorkingSeconds || 0) / t.pageCount) : 0
        }));
    } else if (activeReport === 'points') {
      sheetData = translators.map((t) => ({
        'Nama Penerjemah': t.name,
        Level: t.level || 1,
        'Skor Poin': t.points || 0,
        'Tugas Diselesaikan': t.completedJobsCount
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Laporan');
    XLSX.writeFile(workbook, filename);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const filename = getExportFilename(activeReport, 'pdf');

    // 1. Draw Kop Surat (Header)
    // Query DOM logo image from login or sidebar
    const logoElement = document.querySelector('img[alt="Master Translate"]') as HTMLImageElement;
    let logoW = 15;
    let logoH = 15;
    let hasLogo = false;

    if (logoElement && logoElement.naturalWidth && logoElement.naturalHeight) {
      const ratio = logoElement.naturalWidth / logoElement.naturalHeight;
      logoH = 11;
      logoW = logoH * ratio;
      hasLogo = true;
    }

    if (hasLogo && logoElement) {
      try {
        doc.addImage(logoElement, 'PNG', 14, 11, logoW, logoH);
      } catch (e) {
        hasLogo = false;
      }
    }

    if (!hasLogo) {
      // Fallback
      doc.setFillColor(219, 39, 119); // Fuchsia-600
      doc.roundedRect(14, 10, 15, 15, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('MT', 18, 20);
      logoW = 15;
    }

    const textStartX = 14 + logoW + 5;

    // Company Name & Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('MASTER TRANSLATE INDONESIA', textStartX, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Plaza UNY, Jl. Affandi No.1 C Lt 3, Santren, Caturtunggal, Kec. Depok, Sleman, DI Yogyakarta 55581', textStartX, 20);
    doc.text('Telp: +62 21-555-1234 | Email: info@mastertranslate.com | Web: www.mastertranslate.com', textStartX, 24);

    // Decorative Lines separating header
    doc.setDrawColor(219, 39, 119); // Fuchsia-600
    doc.setLineWidth(0.8);
    doc.line(14, 29, 196, 29);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.2);
    doc.line(14, 31, 196, 31);

    // 2. Metadata Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    let reportTitle = '';
    let currentHeaders: { label: string; x: number; w: number }[] = [];

    if (activeReport === 'task') {
      reportTitle = 'LAPORAN OPERASIONAL TASK POOL';
      currentHeaders = [
        { label: 'KODE', x: 16, w: 20 },
        { label: 'JUDUL DOKUMEN', x: 38, w: 60 },
        { label: 'KLIEN', x: 98, w: 30 },
        { label: 'PENERJEMAH', x: 128, w: 34 },
        { label: 'HLM', x: 162, w: 12 },
        { label: 'STATUS', x: 174, w: 22 }
      ];
    } else if (activeReport === 'translator') {
      reportTitle = 'LAPORAN KINERJA & KAPASITAS PENERJEMAH';
      currentHeaders = [
        { label: 'NAMA PENERJEMAH', x: 16, w: 50 },
        { label: 'STATUS', x: 66, w: 22 },
        { label: 'KEAHLIAN BAHASA', x: 88, w: 46 },
        { label: 'SELESAI', x: 134, w: 22 },
        { label: 'BEBAN KERJA', x: 156, w: 22 },
        { label: 'KAPASITAS', x: 178, w: 22 }
      ];
    } else if (activeReport === 'productivity') {
      reportTitle = 'LAPORAN PRODUKTIVITAS HARIAN';
      currentHeaders = [
        { label: 'TANGGAL', x: 16, w: 45 },
        { label: 'TUGAS SELESAI', x: 61, w: 45 },
        { label: 'TOTAL HALAMAN', x: 106, w: 45 },
        { label: 'POIN TERDISTRIBUSI', x: 151, w: 45 }
      ];
    } else if (activeReport === 'worktime') {
      reportTitle = 'LAPORAN WAKTU EFEKTIF & JEDA PENERJEMAH';
      currentHeaders = [
        { label: 'KODE', x: 16, w: 20 },
        { label: 'JUDUL TUGAS', x: 38, w: 58 },
        { label: 'PENERJEMAH', x: 96, w: 34 },
        { label: 'HLM', x: 130, w: 12 },
        { label: 'WAKTU KERJA', x: 142, w: 27 },
        { label: 'WAKTU JEDA', x: 169, w: 27 }
      ];
    } else if (activeReport === 'points') {
      reportTitle = 'LAPORAN PROFIL & DISTRIBUSI POIN';
      currentHeaders = [
        { label: 'NAMA PENERJEMAH', x: 16, w: 60 },
        { label: 'TINGKAT LEVEL', x: 76, w: 40 },
        { label: 'SKOR POIN', x: 116, w: 40 },
        { label: 'TUGAS SELESAI', x: 156, w: 40 }
      ];
    }

    doc.text(reportTitle, 14, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tanggal Cetak : ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 45);
    doc.text(`Dicetak Oleh   : Super Admin (Sistem Monitoring Penerjemah)`, 14, 49);

    let y = 57;

    // Helper to draw footer
    const drawFooter = () => {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text('Dokumen ini dihasilkan secara otomatis oleh Sistem Monitoring Penerjemah. Rahasia & Terbatas.', 14, 287);
      doc.text(`Halaman ${doc.getCurrentPageInfo().pageNumber}`, 180, 287);
    };

    // Helper to draw table header background
    const drawTableHeader = (headers: { label: string; x: number; w: number }[]) => {
      doc.setFillColor(30, 41, 59); // Deep Slate-800
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      headers.forEach((h) => {
        doc.text(h.label, h.x, y + 5.5);
      });
      y += 8;
    };

    // Helper to draw rows
    const drawRow = (index: number, cells: { text: string; x: number; w: number }[]) => {
      // Zebra striping
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Very light slate-50
        doc.rect(14, y, 182, 7.5, 'F');
      }

      // Row bottom border
      doc.setDrawColor(241, 245, 249); // Slate-100
      doc.setLineWidth(0.15);
      doc.line(14, y + 7.5, 196, y + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // Slate-600
      cells.forEach((c) => {
        doc.text(c.text, c.x, y + 5);
      });

      y += 7.5;

      // Page break check
      if (y > 275) {
        drawFooter();
        doc.addPage();
        y = 20; // start higher on subsequent pages
        drawTableHeader(currentHeaders);
      }
    };

    // Render Table based on activeReport
    if (activeReport === 'task') {
      drawTableHeader(currentHeaders);
      filteredTasks.forEach((t, i) => {
        const cells = [
          { text: t.code, x: 16, w: 20 },
          { text: t.title.length > 33 ? t.title.substring(0, 30) + '...' : t.title, x: 38, w: 60 },
          { text: t.clientName.length > 15 ? t.clientName.substring(0, 13) + '...' : t.clientName, x: 98, w: 30 },
          { text: (t.translatorName || 'Belum Klaim').substring(0, 18), x: 128, w: 34 },
          { text: String(t.pageCount), x: 162, w: 12 },
          { text: t.status, x: 174, w: 22 }
        ];
        drawRow(i, cells);
      });
      drawFooter();
    } else if (activeReport === 'translator') {
      drawTableHeader(currentHeaders);
      translators.forEach((t, i) => {
        const cells = [
          { text: t.name.length > 25 ? t.name.substring(0, 22) + '...' : t.name, x: 16, w: 50 },
          { text: t.status, x: 66, w: 22 },
          { text: t.languages.join(', ').substring(0, 22), x: 88, w: 46 },
          { text: `${t.completedJobsCount} tugas`, x: 134, w: 22 },
          { text: `${t.currentLoadPoints} hlm`, x: 156, w: 22 },
          { text: `${t.maxCapacityPoints} hlm`, x: 178, w: 22 }
        ];
        drawRow(i, cells);
      });
      drawFooter();
    } else if (activeReport === 'productivity') {
      drawTableHeader(currentHeaders);
      productivityData.forEach((d, i) => {
        const cells = [
          { text: d.date, x: 16, w: 45 },
          { text: `${d.count} tugas`, x: 61, w: 45 },
          { text: `${d.pages} hlm`, x: 106, w: 45 },
          { text: `${d.points} Pt`, x: 151, w: 45 }
        ];
        drawRow(i, cells);
      });
      drawFooter();
    } else if (activeReport === 'worktime') {
      drawTableHeader(currentHeaders);
      const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');
      completedTasks.forEach((t, i) => {
        const cells = [
          { text: t.code, x: 16, w: 20 },
          { text: t.title.length > 30 ? t.title.substring(0, 27) + '...' : t.title, x: 38, w: 58 },
          { text: (t.translatorName || '-').substring(0, 18), x: 96, w: 34 },
          { text: String(t.pageCount), x: 130, w: 12 },
          { text: formatClock(t.effectiveWorkSeconds || t.totalWorkingSeconds || 0), x: 142, w: 27 },
          { text: formatClock(t.totalPauseDuration || t.totalIdleSeconds || 0), x: 169, w: 27 }
        ];
        drawRow(i, cells);
      });
      drawFooter();
    } else if (activeReport === 'points') {
      drawTableHeader(currentHeaders);
      translators.forEach((t, i) => {
        const cells = [
          { text: t.name, x: 16, w: 60 },
          { text: `Level ${t.level || 1}`, x: 76, w: 40 },
          { text: `${t.points || 0} Poin`, x: 116, w: 40 },
          { text: `${t.completedJobsCount} tugas`, x: 156, w: 40 }
        ];
        drawRow(i, cells);
      });
      drawFooter();
    }

    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-pink-500" />
            <span>Laporan Kinerja & Operasional</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unduh berkas Excel (SheetJS) dan dokumen PDF resmi untuk evaluasi operasional harian.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#F3E8F4] bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Volume Pekerjaan</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalPages} hlm</p>
          <p className="text-[10px] text-slate-400">Total halaman terjemahan yang disetujui</p>
        </div>

        <div className="rounded-2xl border border-[#F3E8F4] bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Skor Poin</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{totalPoints} Pt</p>
          <p className="text-[10px] text-slate-400">Jumlah poin reward diberikan</p>
        </div>

        <div className="rounded-2xl border border-[#F3E8F4] bg-white p-5 shadow-xs space-y-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Kecepatan Efektif</p>
          <p className="text-2xl font-black text-slate-800 font-mono">
            {avgWorkSecsPerPage > 0 ? `${Math.round(avgWorkSecsPerPage / 60)}` : '0'} mnt / hlm
          </p>
          <p className="text-[10px] text-slate-400">Waktu kerja rata-rata per halaman</p>
        </div>
      </div>

      {/* Report Types selector tabs */}
      <div className="bg-white rounded-xl border border-[#F3E8F4] shadow-xs p-1 flex flex-wrap gap-1 w-full md:w-fit">
        {[
          { id: 'task', label: 'Laporan Task', icon: FileText },
          { id: 'translator', label: 'Laporan Penerjemah', icon: Users },
          { id: 'productivity', label: 'Produktivitas', icon: TrendingUp },
          { id: 'worktime', label: 'Waktu Kerja', icon: Clock },
          { id: 'points', label: 'Poin & Level', icon: Trophy }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeReport === tab.id
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter criteria */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci di laporan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all shadow-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="30days">30 Hari Terakhir</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
      </div>

      {/* Render Table Data */}
      <div className="rounded-2xl border border-[#F3E8F4] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {activeReport === 'task' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-5">Kode & Judul Tugas</th>
                  <th className="py-4 px-3">Klien</th>
                  <th className="py-4 px-3">Penerjemah</th>
                  <th className="py-4 px-3 text-center">Halaman</th>
                  <th className="py-4 px-3 text-center">Poin</th>
                  <th className="py-4 px-3">Durasi</th>
                  <th className="py-4 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-5 text-center text-slate-400">Tidak ada data tugas.</td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold">
                        <span className="font-mono text-[9px] text-pink-500 block">{t.code}</span>
                        <span className="truncate max-w-[200px] block">{t.title}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{t.clientName}</td>
                      <td className="py-3.5 px-3 font-semibold">{t.translatorName || 'Belum Diklaim'}</td>
                      <td className="py-3.5 px-3 text-center font-mono">{t.pageCount} hlm</td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-pink-500">{t.rewardPoints || t.calculatedPoints} Pt</td>
                      <td className="py-3.5 px-3 font-mono">{formatClock(t.effectiveWorkSeconds || t.totalWorkingSeconds || 0)}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-50 text-pink-600 border border-pink-100/50">{t.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'translator' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-5">Nama Penerjemah</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-3">Keahlian Bahasa</th>
                  <th className="py-4 px-3 text-center">Tugas Selesai</th>
                  <th className="py-4 px-3 text-center">Beban Aktif</th>
                  <th className="py-4 px-3 text-center">Maks Kapasitas</th>
                  <th className="py-4 px-3 text-center">Utilisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 text-slate-700">
                {translators.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold">{tr.name}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-550">{tr.status}</td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">{tr.languages.join(', ')}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.completedJobsCount}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.currentLoadPoints} hlm</td>
                    <td className="py-3.5 px-3 text-center font-mono">{tr.maxCapacityPoints} hlm</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-pink-500">{tr.utilizationPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'productivity' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-5">Tanggal</th>
                  <th className="py-4 px-3 text-center">Tugas Selesai</th>
                  <th className="py-4 px-3 text-center">Total Halaman Diterjemahkan</th>
                  <th className="py-4 px-3 text-center">Total Poin Diperoleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 text-slate-700">
                {productivityData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-5 text-center text-slate-400">Belum ada tugas diselesaikan pada periode ini.</td>
                  </tr>
                ) : (
                  productivityData.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold">{d.date}</td>
                      <td className="py-3.5 px-3 text-center font-mono">{d.count} tugas</td>
                      <td className="py-3.5 px-3 text-center font-mono">{d.pages} hlm</td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-pink-500">{d.points} Pt</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'worktime' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-5">Kode & Judul Tugas</th>
                  <th className="py-4 px-3">Penerjemah</th>
                  <th className="py-4 px-3 text-center">Halaman</th>
                  <th className="py-4 px-3">Total Jam Kerja</th>
                  <th className="py-4 px-3">Total Sesi Jeda</th>
                  <th className="py-4 px-3 text-center">Rata-rata Waktu/Halaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 text-slate-700">
                {filteredTasks.filter((t) => t.status === 'COMPLETED').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-5 text-center text-slate-400">Belum ada data waktu kerja tugas diselesaikan.</td>
                  </tr>
                ) : (
                  filteredTasks
                    .filter((t) => t.status === 'COMPLETED')
                    .map((t) => {
                      const avgSecs = t.pageCount > 0 ? Math.round((t.effectiveWorkSeconds || t.totalWorkingSeconds || 0) / t.pageCount) : 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-[9px] text-pink-500 block">{t.code}</span>
                            <span className="truncate max-w-[200px] block">{t.title}</span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">{t.translatorName || '-'}</td>
                          <td className="py-3.5 px-3 text-center font-mono">{t.pageCount} hlm</td>
                          <td className="py-3.5 px-3 font-mono font-semibold">{formatClock(t.effectiveWorkSeconds || t.totalWorkingSeconds || 0)}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{formatClock(t.totalPauseDuration || t.totalIdleSeconds || 0)}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-black text-pink-600">{Math.round(avgSecs / 60)} mnt/hlm</td>
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
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-5">Nama Penerjemah</th>
                  <th className="py-4 px-3 text-center">Level</th>
                  <th className="py-4 px-3 text-center">Total Poin Leaderboard</th>
                  <th className="py-4 px-3 text-center">Jumlah Tugas Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 text-slate-700">
                {translators.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold">{tr.name}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-600">Level {tr.level || 1}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-pink-600">{tr.points || 0} Pt</td>
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
