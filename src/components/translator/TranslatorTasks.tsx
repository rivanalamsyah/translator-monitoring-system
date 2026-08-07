import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Clock,
  Play,
  Pause,
  Send,
  Download,
  AlertTriangle,
  Trophy,
  Activity,
  Award,
  BookOpen,
  Calendar,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatDate, formatClock, formatDuration } from '../../utils/formatters';
import { Task } from '../../types';

export const TranslatorTasks: React.FC = () => {
  const {
    tasks,
    currentTranslatorProfile,
    claimTask,
    startAssignmentTimer,
    pauseAssignmentTimer,
    resumeAssignmentTimer,
    setActiveSubmitAssignment,
    confirmAction,
    timerLogs
  } = useApp();

  const [activeTab, setActiveTab] = useState<'available' | 'working' | 'review' | 'history'>('available');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentTranslatorProfile) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium">
        Memuat data tugas penerjemah...
      </div>
    );
  }

  // Filter tasks based on status and ownership
  const availableTasks = tasks.filter(
    (t) => t.status === 'WAITING_CLAIM' && !t.translatorId
  );

  const workingTasks = tasks.filter(
    (t) =>
      (t.status === 'WORKING' || t.status === 'PAUSED' || t.status === 'REVISION') &&
      t.translatorId === currentTranslatorProfile.id
  );

  const reviewTasks = tasks.filter(
    (t) => t.status === 'WAITING_REVIEW' && t.translatorId === currentTranslatorProfile.id
  );

  const historyTasks = tasks.filter(
    (t) => (t.status === 'COMPLETED' || t.status === 'CANCELLED') && t.translatorId === currentTranslatorProfile.id
  );

  const getFilteredList = () => {
    let list: Task[] = [];
    if (activeTab === 'available') list = availableTasks;
    else if (activeTab === 'working') list = workingTasks;
    else if (activeTab === 'review') list = reviewTasks;
    else if (activeTab === 'history') list = historyTasks;

    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const currentList = getFilteredList();

  const handlePauseClick = (task: Task) => {
    confirmAction({
      title: 'Tangguhkan Pekerjaan?',
      message: 'Masukkan alasan singkat mengapa Anda perlu menjeda pengerjaan task ini.',
      type: 'warning',
      confirmText: 'Jeda Sementara',
      onConfirm: async () => {
        // We can pass a reason to pause
        pauseAssignmentTimer(task.id, 'Jeda pengerjaan sementara oleh penerjemah');
      }
    });
  };

  const getProductivity = (task: Task) => {
    const effectiveSecs = task.effectiveWorkSeconds || task.totalWorkingSeconds || 0;
    if (effectiveSecs === 0 || !task.pageCount) return '-';
    const minutes = effectiveSecs / 60;
    const minPerPage = minutes / task.pageCount;
    return `${minPerPage.toFixed(1)} menit / hlm`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-500" />
            <span>Pusat Kendali Pekerjaan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Klaim tugas dari pool, operasikan pengukur waktu (timer) terintegrasi, dan kirimkan hasil terjemahan Anda.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span>Status Anda: {currentTranslatorProfile.status}</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-2">
        <div className="bg-white rounded-xl border border-[#F3E8F4] shadow-xs p-1 flex gap-1 w-full sm:w-auto">
          {[
            { id: 'available', label: 'Tersedia di Pool', count: availableTasks.length },
            { id: 'working', label: 'Sedang Dikerjakan', count: workingTasks.length },
            { id: 'review', label: 'Menunggu Review', count: reviewTasks.length },
            { id: 'history', label: 'Riwayat', count: historyTasks.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white shadow-sm shadow-pink-200'
                  : 'text-slate-500 hover:bg-slate-150/40 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs mt-2 sm:mt-0">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kode atau judul tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-pink-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Task list view */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-2xl py-20 text-center border border-[#F3E8F4] shadow-xs text-slate-450 text-xs flex flex-col items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-slate-200" />
          <div>
            <p className="font-bold text-slate-600">Tidak ada tugas dalam kategori ini</p>
            <p className="text-[10px] text-slate-450 mt-0.5">Seluruh tugas baru akan muncul secara otomatis secara real-time</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((task) => {
            const isWorking = task.status === 'WORKING';
            const isPaused = task.status === 'PAUSED';
            const isRevision = task.status === 'REVISION';
            const isActive = isWorking || isPaused || isRevision;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-[#F3E8F4] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Code & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold font-mono text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md uppercase">
                      {task.code}
                    </span>
                    <div className="flex items-center gap-1">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  {/* Title & Document specifications */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{task.title}</h3>
                    <p className="text-[9px] text-pink-500 font-bold uppercase tracking-wider mt-1">
                      {task.documentType} • {task.difficulty || 'Normal'}
                    </p>
                  </div>

                  {/* Specification Table */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-slate-50 py-3 font-medium text-slate-600">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Bahasa</span>
                      <span className="font-bold text-slate-800">{task.languageFrom} → {task.languageTo}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Beban Halaman</span>
                      <span className="font-bold text-slate-800">{task.pageCount} halaman</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Poin Reward</span>
                      <span className="font-bold text-pink-600">{task.rewardPoints || task.calculatedPoints} Poin</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Estimasi Waktu</span>
                      <span className="font-bold text-slate-800">{task.estimatedMinutes} menit</span>
                    </div>
                  </div>

                  {/* Waktu Kerja Telemetri (Tersedia khusus pengerjaan aktif & riwayat) */}
                  {isActive && (
                    <div className="bg-[#FFF8FB] rounded-xl p-3 border border-[#FDF0F6] text-[10px] space-y-1.5 font-mono text-slate-600">
                      <div className="flex justify-between">
                        <span>Waktu Efektif:</span>
                        <span className="font-bold text-pink-600">
                          {formatClock(task.effectiveWorkSeconds || task.totalWorkingSeconds || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Jeda:</span>
                        <span className="font-bold text-amber-500">
                          {formatClock(task.totalPauseDuration || task.totalIdleSeconds || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Produktivitas:</span>
                        <span className="font-bold text-slate-800">{getProductivity(task)}</span>
                      </div>
                    </div>
                  )}

                  {/* Revision Alert block */}
                  {isRevision && task.revisionNotes && (
                    <div className="bg-red-50 text-red-700 text-[10px] font-medium p-2.5 rounded-xl border border-red-100 flex gap-1.5 items-start">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <div>
                        <span className="font-bold block">Catatan Revisi Admin:</span>
                        <span className="leading-relaxed">{task.revisionNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* Target Deadline */}
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                    <Calendar className="h-3 w-3" />
                    <span>Deadline: {formatDate(task.deadlineAt)}</span>
                  </div>
                </div>

                {/* Operations area */}
                <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-end gap-2">
                  {activeTab === 'available' && (
                    <button
                      onClick={() => claimTask(task.id)}
                      disabled={currentTranslatorProfile.status === 'BUSY'}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        currentTranslatorProfile.status === 'BUSY'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-pink-500 text-white hover:bg-pink-600 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Ambil Task</span>
                    </button>
                  )}

                  {activeTab === 'working' && (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {isWorking ? (
                        <button
                          onClick={() => handlePauseClick(task)}
                          className="py-2 border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => startAssignmentTimer(task.id)}
                          className="py-2 border border-emerald-250 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Play className="h-3.5 w-3.5 animate-pulse" />
                          <span>Start / Resume</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveSubmitAssignment(task)}
                        disabled={isPaused}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isPaused
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-pink-500 text-white hover:bg-pink-600 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Kirim Kerja</span>
                      </button>
                    </div>
                  )}

                  {activeTab === 'review' && (
                    <div className="w-full text-center py-2 bg-slate-50 text-slate-450 border border-slate-105 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin text-pink-400" />
                      <span>Sedang Ditinjau Admin</span>
                    </div>
                  )}

                  {activeTab === 'history' && task.resultFileUrl && (
                    <a
                      href={task.resultFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 border border-slate-200 text-slate-655 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka Link Pekerjaan</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
