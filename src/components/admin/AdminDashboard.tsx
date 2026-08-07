import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  FileCheck,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award,
  Zap,
  Activity,
  Layers,
  FileText,
  CheckCircle,
  Bell,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { AvatarImage } from '../common/AvatarImage';

export const AdminDashboard: React.FC = () => {
  const {
    translators,
    tasks,
    setIsNewAssignmentModalOpen,
    setIsNewTranslatorModalOpen,
    setAdminTab,
    notifications,
    rewardPointHistory
  } = useApp();

  // ── Stats Calculations ──────────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats = useMemo(() => {
    // Tasks stats
    const todayTasks = tasks.filter((t) => new Date(t.createdAt).getTime() >= todayStart.getTime());
    const waitingClaim = tasks.filter((t) => t.status === 'WAITING_CLAIM');
    const working = tasks.filter((t) => t.status === 'WORKING' || t.status === 'PAUSED' || t.status === 'REVISION');
    const waitingReview = tasks.filter((t) => t.status === 'WAITING_REVIEW');
    const completedToday = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.completedAt && new Date(t.completedAt).getTime() >= todayStart.getTime()
    );

    // Translators availability stats
    const freeTranslators = translators.filter((t) => t.status === 'FREE').length;
    const busyTranslators = translators.filter((t) => t.status === 'BUSY').length;
    const breakTranslators = translators.filter((t) => t.status === 'BREAK').length;
    const offlineTranslators = translators.filter((t) => t.status === 'OFFLINE').length;

    return {
      todayTasksCount: todayTasks.length,
      waitingClaimCount: waitingClaim.length,
      workingCount: working.length,
      waitingReviewCount: waitingReview.length,
      completedTodayCount: completedToday.length,
      freeTranslators,
      busyTranslators,
      breakTranslators,
      offlineTranslators
    };
  }, [tasks, translators, todayStart]);

  // Top 5 Monthly Leaderboard
  const topMonthly = useMemo(() => {
    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyPoints: Record<string, { name: string; points: number; avatar: string }> = {};

    translators.forEach((tr) => {
      monthlyPoints[tr.id] = { name: tr.name, points: 0, avatar: tr.avatar || '' };
    });

    rewardPointHistory.forEach((item) => {
      if (item.timestamp && item.timestamp.substring(0, 7) === currentMonthStr && monthlyPoints[item.translatorId]) {
        monthlyPoints[item.translatorId].points += item.points || 0;
      }
    });

    return Object.values(monthlyPoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [translators, rewardPointHistory]);

  // Daily productivity graph data (pages completed in the last 7 days)
  const dailyProductivity = useMemo(() => {
    const data: { label: string; pages: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      // Find tasks completed on this specific day
      const pagesCompleted = tasks
        .filter((t) => {
          if (t.status !== 'COMPLETED' || !t.completedAt) return false;
          const completedTime = new Date(t.completedAt).getTime();
          return completedTime >= d.getTime() && completedTime < nextDay.getTime();
        })
        .reduce((sum, t) => sum + (t.pageCount || 0), 0);

      data.push({ label, pages: pagesCompleted });
    }
    return data;
  }, [tasks]);

  const maxPagesInProductivity = Math.max(...dailyProductivity.map((d) => d.pages), 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome Control center */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 shadow-md border border-pink-600/10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-pink-100 uppercase tracking-wider">Pusat Telemetri Langsung</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-heading">Selamat Datang, Admin</h2>
          <p className="text-[11px] text-pink-100/90 max-w-xl leading-relaxed">
            Pantau performa secara real-time, buat tugas di Task Pool, serta kelola akun dan skor gamifikasi seluruh penerjemah aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab('assignments')}
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-pink-50 px-4 py-2.5 text-xs font-bold text-pink-600 shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Tugas Baru</span>
          </button>
          <button
            onClick={() => setAdminTab('translators')}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span>Kelola Penerjemah</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Task Hari Ini', value: stats.todayTasksCount, desc: 'Dibuat hari ini', icon: Plus, color: 'text-pink-500', bg: 'bg-pink-50/70 border-pink-100/80' },
          { label: 'Waiting Claim', value: stats.waitingClaimCount, desc: 'Di dalam pool', icon: UserCheck, color: 'text-amber-500', bg: 'bg-amber-50/70 border-amber-100/80' },
          { label: 'Sedang Dikerjakan', value: stats.workingCount, desc: 'Oleh translator', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50/70 border-indigo-100/80' },
          { label: 'Menunggu Review', value: stats.waitingReviewCount, desc: 'Perlu keputusan', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-50/70 border-emerald-100/80' },
          { label: 'Selesai Hari Ini', value: stats.completedTodayCount, desc: 'Disetujui admin', icon: CheckCircle, color: 'text-rose-500', bg: 'bg-rose-50/70 border-rose-100/80' }
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-white p-4.5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200 ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">{card.label}</span>
              <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black font-mono ${card.color}`}>{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row: Translators Availability & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Availability Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex flex-col justify-between">
          <div className="border-b border-[#F3E8F4] pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-pink-500" />
              <span>Status Ketersediaan Penerjemah</span>
            </h3>
            <p className="text-[10px] text-slate-400">Status real-time kapasitas translator aktif</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 text-center">
              <span className="text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider">FREE</span>
              <p className="text-3xl font-black text-emerald-600 font-mono mt-1">{stats.freeTranslators}</p>
              <span className="text-[9px] text-slate-400 block mt-1">Siap klaim task</span>
            </div>
            <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100 text-center">
              <span className="text-[9px] font-extrabold uppercase text-amber-600 tracking-wider">BUSY</span>
              <p className="text-3xl font-black text-amber-600 font-mono mt-1">{stats.busyTranslators}</p>
              <span className="text-[9px] text-slate-400 block mt-1">Sedang bekerja</span>
            </div>
            <div className="bg-sky-50/50 rounded-xl p-3.5 border border-sky-100 text-center">
              <span className="text-[9px] font-extrabold uppercase text-sky-600 tracking-wider">BREAK</span>
              <p className="text-3xl font-black text-sky-600 font-mono mt-1">{stats.breakTranslators}</p>
              <span className="text-[9px] text-slate-400 block mt-1">Jeda pengerjaan</span>
            </div>
            <div className="bg-slate-55/40 rounded-xl p-3.5 border border-slate-100 text-center">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">OFFLINE</span>
              <p className="text-3xl font-black text-slate-500 font-mono mt-1">{stats.offlineTranslators}</p>
              <span className="text-[9px] text-slate-400 block mt-1">Tidak aktif</span>
            </div>
          </div>

          <button
            onClick={() => setAdminTab('translators')}
            className="w-full text-center mt-5 text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <span>Tampilkan Daftar Penerjemah</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Top 5 Monthly Leaderboard */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-[#F3E8F4] pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-pink-500" />
                <span>5 Besar Leaderboard Bulan Ini</span>
              </h3>
              <p className="text-[10px] text-slate-400">Akumulasi Reward Points sepanjang bulan ini</p>
            </div>

            <div className="space-y-2.5">
              {topMonthly.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[11px]">Belum ada poin diperoleh bulan ini.</div>
              ) : (
                topMonthly.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold font-mono text-slate-400 w-4">#{idx + 1}</span>
                      <AvatarImage src={item.avatar} name={item.name} className="h-6.5 w-6.5 rounded-full object-cover shrink-0" />
                      <span className="font-bold text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-black text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md text-[10px]">
                      {item.points} Pt
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setAdminTab('leaderboard')}
            className="w-full text-center mt-4 text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <span>Buka Leaderboard Lengkap</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Daily Productivity Graph */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex flex-col justify-between">
          <div className="border-b border-[#F3E8F4] pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-pink-500" />
              <span>Produktivitas Harian (7 Hari Terakhir)</span>
            </h3>
            <p className="text-[10px] text-slate-400">Total halaman dokumen disetujui per hari</p>
          </div>

          <div className="flex items-end justify-between gap-2 h-36 px-2">
            {dailyProductivity.map((day) => {
              const heightPct = Math.round((day.pages / maxPagesInProductivity) * 100);
              return (
                <div key={day.label} className="flex flex-col items-center gap-1 flex-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-850 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-opacity duration-150 pointer-events-none whitespace-nowrap shadow-md">
                    {day.pages} hlm
                  </div>
                  <div className="w-full bg-slate-100 rounded-lg h-24 flex items-end overflow-hidden">
                    <div
                      className="bg-gradient-to-t from-pink-500 to-rose-400 w-full rounded-t-md transition-all duration-500 ease-out"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{day.label}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setAdminTab('reports')}
            className="w-full text-center mt-4 text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <span>Buka Laporan Kinerja</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Panel Notifikasi Penting */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs">
        <div className="border-b border-[#F3E8F4] pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="h-4.5 w-4.5 text-pink-500" />
              <span>Notifikasi & Aktivitas Sistem Penting</span>
            </h3>
            <p className="text-[10px] text-slate-400">Pemberitahuan sistem dan telemetri log</p>
          </div>
          <span className="text-[9px] font-extrabold uppercase text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Realtime</span>
        </div>

        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-450 text-xs">Tidak ada notifikasi baru hari ini.</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-[#FDF0F6] bg-[#FFF8FB] text-xs transition-colors hover:bg-pink-50/30"
              >
                <div className="bg-pink-100 text-pink-600 h-7 w-7 rounded-lg flex items-center justify-center shrink-0">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 block truncate">{notif.title}</span>
                    <span className="text-[9px] text-slate-400 shrink-0">{formatDate(notif.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
