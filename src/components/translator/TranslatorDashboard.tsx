import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Play,
  Pause,
  Send,
  Download,
  AlertTriangle,
  Trophy,
  Award,
  Zap,
  Activity,
  Layers,
  FileText,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Flame,
  Crown
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatClock, formatDuration, formatDate } from '../../utils/formatters';
import { AvatarImage } from '../common/AvatarImage';

export const TranslatorDashboard: React.FC = () => {
  const {
    currentTranslatorProfile,
    tasks,
    startAssignmentTimer,
    resumeAssignmentTimer,
    pauseAssignmentTimer,
    setActiveSubmitAssignment,
    confirmAction,
    toggleTranslatorStatus,
    setTranslatorTab,
    rewardPointHistory
  } = useApp();

  const [activeTask, setActiveTask] = useState<any>(null);

  // Get tasks belonging to this translator
  const myTasks = currentTranslatorProfile
    ? tasks.filter((t) => t.translatorId === currentTranslatorProfile.id || t.claimedById === currentTranslatorProfile.id)
    : [];

  // Active Task (Working, Paused, or Revision)
  const currentActiveTask = myTasks.find(
    (t) => t.status === 'WORKING' || t.status === 'PAUSED' || t.status === 'REVISION'
  );

  const completedTasks = myTasks.filter((t) => t.status === 'COMPLETED');
  const completedCount = completedTasks.length;
  const totalPages = completedTasks.reduce((sum, t) => sum + (t.pageCount || 0), 0);
  
  // Total work seconds for completed tasks (used for productivity metrics)
  const completedWorkSecs = completedTasks.reduce((sum, t) => sum + (t.effectiveWorkSeconds || t.totalWorkingSeconds || 0), 0);
  
  // Total work seconds for all tasks (used for total hours card)
  const totalWorkSecs = myTasks.reduce((sum, t) => sum + (t.effectiveWorkSeconds || t.totalWorkingSeconds || 0), 0);
  const totalHours = (totalWorkSecs / 3600).toFixed(1);

  // Average minutes per page (completed tasks only)
  const averageMinPerPage = useMemo(() => {
    if (totalPages === 0 || completedWorkSecs === 0) return '-';
    const totalMinutes = completedWorkSecs / 60;
    return `${(totalMinutes / totalPages).toFixed(1)} mnt/hlm`;
  }, [totalPages, completedWorkSecs]);

  // Points this month
  const pointsThisMonth = useMemo(() => {
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    return rewardPointHistory
      .filter((h) => h.translatorId === currentTranslatorProfile?.id && h.timestamp.substring(0, 7) === currentMonthStr)
      .reduce((sum, h) => sum + (h.points || 0), 0);
  }, [rewardPointHistory, currentTranslatorProfile?.id]);

  // Ranking calculation (simulation based on total points)
  const ranking = useMemo(() => {
    // If we have stats, find rank in monthly leaderboard
    return 1; // placeholder rank, will be calculated dynamically in real dashboard
  }, []);

  const handlePause = (task: any) => {
    confirmAction({
      title: 'Jeda Pekerjaan?',
      message: 'Apakah Anda ingin menangguhkan penghitung waktu sementara?',
      type: 'warning',
      confirmText: 'Tangguhkan',
      onConfirm: async () => {
        await pauseAssignmentTimer(task.id, 'Jeda pengerjaan dari dashboard');
      }
    });
  };

  if (!currentTranslatorProfile) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium">
        Memuat ruang kerja penerjemah...
      </div>
    );
  }

  // Define Achievements list based on points
  const achievements = [
    { title: 'Penerjemah Pemula', desc: 'Selesaikan tugas pertama Anda', unlocked: completedCount >= 1, icon: Trophy, color: 'text-amber-500 bg-amber-50' },
    { title: 'Penerjemah Aktif', desc: 'Raih total skor di atas 100 poin', unlocked: (currentTranslatorProfile.points || 0) >= 100, icon: Flame, color: 'text-orange-500 bg-orange-50' },
    { title: 'Kecepatan Cahaya', desc: 'Selesaikan tugas di bawah estimasi waktu', unlocked: completedCount >= 2, icon: Zap, color: 'text-sky-500 bg-sky-50' },
    { title: 'Akurasi Sempurna', desc: 'Mendapat approval tanpa revisi', unlocked: completedCount >= 3, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Profile banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <AvatarImage
            src={currentTranslatorProfile.avatar}
            name={currentTranslatorProfile.name}
            className="h-16 w-16 rounded-2xl object-cover ring-4 ring-pink-100"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-800">{currentTranslatorProfile.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Level {currentTranslatorProfile.level || 1} • {currentTranslatorProfile.languages.join(', ')}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`h-2 w-2 rounded-full ${currentTranslatorProfile.status === 'FREE' ? 'bg-emerald-500' : currentTranslatorProfile.status === 'BUSY' ? 'bg-amber-500' : 'bg-blue-500'} animate-pulse`} />
              <span className="text-[10px] font-bold text-slate-500">Status saat ini: {currentTranslatorProfile.status}</span>
            </div>
          </div>
        </div>

        {/* Change status control */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mr-2">Ubah Status Ketersediaan:</span>
          {['FREE', 'BUSY', 'BREAK'].map((status) => {
            const isCurrent = currentTranslatorProfile.status === status;
            let themeClass = '';
            if (status === 'FREE') themeClass = isCurrent ? 'bg-emerald-500 text-white' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100';
            else if (status === 'BUSY') themeClass = isCurrent ? 'bg-amber-500 text-white' : 'text-amber-600 bg-amber-50 hover:bg-amber-100';
            else if (status === 'BREAK') themeClass = isCurrent ? 'bg-sky-500 text-white' : 'text-sky-600 bg-sky-50 hover:bg-sky-100';

            return (
              <button
                key={status}
                onClick={async () => {
                  if (!isCurrent) {
                    await toggleTranslatorStatus(currentTranslatorProfile.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${themeClass}`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI stats section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Poin Bulan Ini', value: pointsThisMonth, sub: 'Reward points berjalan', icon: Trophy, color: 'text-pink-500', bg: 'bg-pink-50/70 border-pink-100/80' },
          { label: 'Peringkat Papan Skor', value: `#${ranking}`, sub: 'Top Leaderboard', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50/70 border-amber-100/80' },
          { label: 'Halaman Terjemahan', value: `${totalPages} hlm`, sub: 'Akumulasi tugas selesai', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50/70 border-emerald-100/80' },
          { label: 'Total Jam Kerja', value: `${totalHours} jam`, sub: 'Waktu kerja efektif', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50/70 border-indigo-100/80' },
          { label: 'Rerata Menit / Hlm', value: averageMinPerPage, sub: 'Produktivitas rata-rata', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50/70 border-rose-100/80' }
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border bg-white p-4.5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200 ${kpi.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="mt-2.5">
              <p className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Active Task Workspace & Unlocked Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Task Workspace card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-[#F3E8F4] pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-pink-500 animate-pulse" />
                <span>Workspace Tugas Aktif</span>
              </h3>
              <span className="text-[9px] font-extrabold uppercase text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Live Timer</span>
            </div>

            {!currentActiveTask ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-slate-200" />
                <div>
                  <p className="font-bold text-slate-550">Tidak ada tugas aktif saat ini</p>
                  <p className="text-[10px] text-slate-350 mt-0.5">Klaim tugas baru dari pool tugas untuk mulai bekerja</p>
                </div>
                <button
                  onClick={() => setTranslatorTab('tasks')}
                  className="mt-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-[10px] shadow-sm transition-all cursor-pointer"
                >
                  Buka Pool Tugas
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-50 pb-3">
                  <div>
                    <span className="text-[9px] font-extrabold font-mono text-pink-500 bg-pink-50 px-2 py-0.5 rounded uppercase">
                      {currentActiveTask.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1.5">{currentActiveTask.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Spesifikasi: {currentActiveTask.documentType} • {currentActiveTask.pageCount} halaman
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Tenggat Waktu</span>
                    <span className="text-xs font-bold text-slate-700 block">{formatDate(currentActiveTask.deadlineAt)}</span>
                  </div>
                </div>

                {/* Clock telemetry display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#FFF8FB] rounded-xl p-3 border border-[#FDF0F6] text-center">
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Durasi Efektif</span>
                    <p className="text-lg font-black font-mono text-pink-600 mt-1">
                      {formatClock(currentActiveTask.effectiveWorkSeconds || currentActiveTask.totalWorkingSeconds || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Durasi Jeda</span>
                    <p className="text-lg font-black font-mono text-slate-500 mt-1">
                      {formatClock(currentActiveTask.totalPauseDuration || currentActiveTask.totalIdleSeconds || 0)}
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-center">
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Poin Reward</span>
                    <p className="text-lg font-black font-mono text-emerald-600 mt-1">
                      {currentActiveTask.rewardPoints || currentActiveTask.calculatedPoints} Pt
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pt-2">
                  {currentActiveTask.status === 'WORKING' ? (
                    <button
                      onClick={() => handlePause(currentActiveTask)}
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Jeda Waktu</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => startAssignmentTimer(currentActiveTask.id)}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Play className="h-4 w-4 animate-pulse" />
                      <span>Mulai / Lanjut</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveSubmitAssignment(currentActiveTask)}
                    disabled={currentActiveTask.status === 'PAUSED'}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      currentActiveTask.status === 'PAUSED'
                        ? 'bg-slate-100 text-slate-450 border border-slate-200 cursor-not-allowed'
                        : 'bg-pink-500 text-white hover:bg-pink-600 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    <span>Kirim Hasil Terjemahan</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentActiveTask && (
            <button
              onClick={() => setTranslatorTab('tasks')}
              className="w-full text-center mt-3 text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span>Lihat Detail Tugas Lainnya</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Unlocked Achievements list */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3E8F4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-[#F3E8F4] pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-pink-500" />
                <span>Pencapaian Gamifikasi Terbaru</span>
              </h3>
              <p className="text-[10px] text-slate-400">Badge & medal yang telah berhasil Anda buka</p>
            </div>

            <div className="space-y-3">
              {achievements.map((badge) => (
                <div
                  key={badge.title}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    badge.unlocked
                      ? 'border-[#FDF0F6] bg-[#FFF8FB] opacity-100'
                      : 'border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${badge.color}`}>
                    <badge.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block ${badge.unlocked ? 'text-slate-850' : 'text-slate-500'}`}>
                      {badge.title}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">{badge.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setTranslatorTab('leaderboard')}
            className="w-full text-center mt-4 text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <span>Buka Papan Skor & Badge</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
