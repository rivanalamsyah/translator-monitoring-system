import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  Zap,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Target,
  Languages,
  ChevronRight,
  Loader2,
  Trophy,
  Play,
  Pause,
  UploadCloud,
} from 'lucide-react';
import { ClaimableTask } from '../../types';
import { formatClock } from '../../utils/formatters';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE:      { label: 'Tersedia',       color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  CLAIMED:        { label: 'Diklaim',        color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-900/30' },
  WORKING:        { label: 'Dikerjakan',     color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  PAUSED:         { label: 'Ditangguhkan',   color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  WAITING_REVIEW: { label: 'Menunggu Review', color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  REVISION:       { label: 'Revisi',         color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/30' },
  COMPLETED:      { label: 'Selesai',        color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-700' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  EASY:   { label: 'Mudah',  color: 'text-emerald-600' },
  MEDIUM: { label: 'Sedang', color: 'text-amber-600' },
  HARD:   { label: 'Sulit',  color: 'text-red-600' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Rendah',  color: 'text-slate-500' },
  MEDIUM: { label: 'Sedang',  color: 'text-blue-500' },
  HIGH:   { label: 'Tinggi',  color: 'text-orange-500' },
  URGENT: { label: 'Mendesak', color: 'text-red-600 font-bold' },
};

function formatDeadline(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const diffHrs = (d.getTime() - now.getTime()) / 3600000;
  if (diffHrs < 0) return { text: 'Lewat Deadline', urgent: true };
  if (diffHrs < 24) return { text: `${Math.round(diffHrs)} jam lagi`, urgent: true };
  const days = Math.floor(diffHrs / 24);
  return { text: `${days} hari lagi`, urgent: false };
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard: React.FC<{
  task: ClaimableTask;
  isMine: boolean;
  onClaim: (id: string) => void;
  onSubmit: (task: ClaimableTask) => void;
}> = ({ task, isMine, onClaim, onSubmit }) => {
  const {
    startAssignmentTimer,
    resumeAssignmentTimer,
    setActivePauseAssignment,
    setActiveSubmitAssignment,
  } = useApp();

  const [submitUrl, setSubmitUrl] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.AVAILABLE;
  const difficulty = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.MEDIUM;
  const deadline = formatDeadline(task.deadlineAt);

  const isWorking = task.status === 'WORKING';
  const isPaused = task.status === 'PAUSED';
  const isRevision = task.status === 'REVISION';
  const isAssigned = task.status === 'ASSIGNED' || task.status === 'CLAIMED';

  const totalWorkSecs = task.effectiveWorkSeconds || 0;
  const totalPauseSecs = task.totalPauseDuration || 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden flex flex-col justify-between
      ${task.status === 'AVAILABLE' ? 'border-pink-200' : 'border-slate-200'}`}>
      
      {/* Top stripe decoration */}
      {task.status === 'AVAILABLE' && (
        <div className="h-1 bg-gradient-to-r from-pink-400 to-rose-400" />
      )}
      {task.status === 'WORKING' && (
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
      )}
      {task.status === 'REVISION' && (
        <div className="h-1 bg-gradient-to-r from-rose-500 to-red-600" />
      )}

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Header row */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  {task.code}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                {deadline.urgent && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1 border border-rose-100">
                    <AlertTriangle className="w-2.5 h-2.5" /> Urgent
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h3>
            </div>
            {/* Reward points badge */}
            <div className="shrink-0 text-center bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-xl px-3 py-2 shadow-sm min-w-[54px]">
              <p className="text-base font-extrabold leading-tight">{task.rewardPoints}</p>
              <p className="text-[8px] font-semibold uppercase tracking-wide opacity-90">Poin</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium">
              <Languages className="w-3 h-3 text-slate-400" />
              {task.languageFrom} → {task.languageTo}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium">
              <FileText className="w-3 h-3 text-slate-400" />
              {task.pageCount} hal
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              ~{task.estimatedMinutes} mnt
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-medium ${difficulty.color}`}>
              <Zap className="w-3 h-3" />
              {difficulty.label}
            </span>
          </div>
        </div>

        {/* Action / Context Block */}
        <div>
          {/* Revision notes */}
          {task.status === 'REVISION' && task.revisionNotes && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 mb-3">
              <p className="text-[10px] font-bold text-rose-700 mb-0.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Catatan Revisi:</span>
              </p>
              <p className="text-[11px] text-slate-655 italic">"{task.revisionNotes}"</p>
            </div>
          )}

          {/* Timer logs & controller for active tasks */}
          {(isWorking || isPaused || isRevision || isAssigned) && isMine && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center space-y-3 mb-2">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Pencatat Waktu Kerja
                </p>
                <p className="text-2xl font-black font-mono text-pink-600">
                  {formatClock(isWorking ? totalWorkSecs : totalPauseSecs)}
                </p>
                <div className="flex justify-center gap-4 text-[9px] text-slate-400 font-mono">
                  <span>Kerja: {formatClock(totalWorkSecs)}</span>
                  <span>Jeda: {formatClock(totalPauseSecs)}</span>
                </div>
              </div>

              {/* Action play/pause/submit buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {(isAssigned || isRevision) && (
                  <button
                    onClick={() => startAssignmentTimer(task.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-pink-600 hover:bg-pink-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" /> Mulai
                  </button>
                )}

                {isWorking && (
                  <button
                    onClick={() => setActivePauseAssignment(task as any)}
                    className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Pause className="w-3 h-3" /> Jeda
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={() => resumeAssignmentTimer(task.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-pink-600 hover:bg-pink-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3" /> Lanjutkan
                  </button>
                )}

                <button
                  onClick={() => setActiveSubmitAssignment(task as any)}
                  className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-750 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" /> Kirim
                </button>
              </div>
            </div>
          )}

          {/* Submission preview for review queue / history */}
          {task.resultFileUrl && (task.status === 'WAITING_REVIEW' || task.status === 'COMPLETED') && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs mb-2">
              <p className="font-bold text-slate-700 mb-0.5">Hasil Terjemahan:</p>
              <a
                href={task.resultFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-pink-600 hover:underline break-all font-medium flex items-center gap-1 mt-0.5"
              >
                <span>Lihat Tautan Google Drive</span>
                <ChevronRight className="w-3 h-3" />
              </a>
              {task.submissionNotes && (
                <p className="text-slate-400 text-[10px] mt-1.5 italic">Catatan: "{task.submissionNotes}"</p>
              )}
            </div>
          )}

          {/* Claim button for available pool */}
          {task.status === 'AVAILABLE' && (
            <button
              onClick={() => onClaim(task.id)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600
                text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Ambil & Klaim Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main ClaimableTasksView ────────────────────────────────────────────────────
export const ClaimableTasksView: React.FC = () => {
  const { claimableTasks, currentTranslatorProfile, claimTask, submitClaimedTask } = useApp();
  
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState<'available' | 'active' | 'review' | 'completed'>('available');
  const [filterLang, setFilterLang] = useState<string>('ALL');

  const languages = useMemo(() => {
    const langs = new Set<string>();
    claimableTasks.forEach((t) => langs.add(`${t.languageFrom} → ${t.languageTo}`));
    return Array.from(langs);
  }, [claimableTasks]);

  // Sub-tab collections filtering
  const availableTasks = useMemo(() => {
    return claimableTasks.filter((t) => t.status === 'AVAILABLE');
  }, [claimableTasks]);

  const activeTasks = useMemo(() => {
    return claimableTasks.filter((t) => 
      t.claimedById === currentTranslatorProfile?.id && 
      ['WORKING', 'PAUSED', 'REVISION', 'ASSIGNED', 'CLAIMED'].includes(t.status)
    );
  }, [claimableTasks, currentTranslatorProfile?.id]);

  const reviewTasks = useMemo(() => {
    return claimableTasks.filter((t) => 
      t.claimedById === currentTranslatorProfile?.id && 
      t.status === 'WAITING_REVIEW'
    );
  }, [claimableTasks, currentTranslatorProfile?.id]);

  const completedTasks = useMemo(() => {
    return claimableTasks.filter((t) => 
      t.claimedById === currentTranslatorProfile?.id && 
      ['COMPLETED', 'CANCELLED'].includes(t.status)
    );
  }, [claimableTasks, currentTranslatorProfile?.id]);

  // Apply search and language filter on selected subTab collection
  const activeCollection = useMemo(() => {
    let baseColl = [];
    if (subTab === 'available') baseColl = availableTasks;
    else if (subTab === 'active') baseColl = activeTasks;
    else if (subTab === 'review') baseColl = reviewTasks;
    else if (subTab === 'completed') baseColl = completedTasks;

    return baseColl.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase());
      const matchLang   = filterLang === 'ALL' || `${t.languageFrom} → ${t.languageTo}` === filterLang;
      return matchSearch && matchLang;
    });
  }, [subTab, availableTasks, activeTasks, reviewTasks, completedTasks, search, filterLang]);

  const handleSubmit = (task: ClaimableTask) => {
    submitClaimedTask(task.id, task.resultFileUrl || '', task.submissionNotes || '');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/10">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Tugas & Pool</h1>
          <p className="text-xs text-slate-400">Klaim tugas tersedia dari pool atau kelola tugas aktif Anda</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tersedia di Pool', value: availableTasks.length, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-100' },
          { label: 'Sedang Dikerjakan', value: activeTasks.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Menunggu Review', value: reviewTasks.length, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
          { label: 'Tugas Selesai', value: completedTasks.length, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3.5 ${s.bg}`}>
            <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        <button
          onClick={() => setSubTab('available')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'available' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Task Pool ({availableTasks.length})
        </button>
        <button
          onClick={() => setSubTab('active')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'active' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Sedang Dikerjakan ({activeTasks.length})
        </button>
        <button
          onClick={() => setSubTab('review')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'review' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Menunggu Review ({reviewTasks.length})
        </button>
        <button
          onClick={() => setSubTab('completed')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'completed' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Riwayat ({completedTasks.length})
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan kode atau judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all"
          />
        </div>
        {languages.length > 0 && (
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
          >
            <option value="ALL">Semua Bahasa</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
      </div>

      {/* Task grid */}
      {activeCollection.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
          <Target className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-bold text-xs">
            {subTab === 'available'
              ? 'Belum ada task yang tersedia di pool saat ini.'
              : subTab === 'active'
              ? 'Anda tidak memiliki tugas yang sedang aktif dikerjakan.'
              : subTab === 'review'
              ? 'Tidak ada tugas yang sedang dalam antrean review.'
              : 'Belum ada tugas yang diselesaikan.'}
          </p>
          <p className="text-slate-350 text-[10px] mt-1">
            Gunakan filter pencarian di atas jika ingin merubah kriteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeCollection.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isMine={task.claimedById === currentTranslatorProfile?.id}
              onClaim={claimTask}
              onSubmit={handleSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
