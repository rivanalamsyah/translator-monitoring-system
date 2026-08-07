import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  FileCheck,
  Clock,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  UserCheck,
  Send,
  History,
  FileEdit
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatDate, formatDocumentType, formatClock } from '../../utils/formatters';
import { Task, TaskStatus } from '../../types';

export const TasksList: React.FC = () => {
  const {
    tasks,
    translators,
    deleteAssignment,
    createAssignment,
    updateAssignment,
    setIsNewAssignmentModalOpen,
    setActiveReviewAssignment,
    confirmAction,
    activityLogs,
    reviewClaimedTask
  } = useApp();

  const [activeSubmenu, setActiveSubmenu] = useState<
    'all' | 'create' | 'DRAFT' | 'WAITING_CLAIM' | 'WORKING' | 'WAITING_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'history'
  >('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDocType, setNewDocType] = useState('General');
  const [newPageCount, setNewPageCount] = useState(5);
  const [newLangFrom, setNewLangFrom] = useState('Inggris');
  const [newLangTo, setNewLangTo] = useState('Indonesia');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDifficulty, setNewDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [newDeadline, setNewDeadline] = useState('');
  const [newSourceFileName, setNewSourceFileName] = useState('Dokumen_Sumber.pdf');
  const [newSourceFileUrl, setNewSourceFileUrl] = useState('https://drive.google.com/file/d/source_mock');
  const [formStatus, setFormStatus] = useState<'WAITING_CLAIM' | 'DRAFT'>('WAITING_CLAIM');

  // Filter tasks based on active submenu and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.translatorName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      if (!matchesSearch || !matchesPriority) return false;

      if (activeSubmenu === 'all') return true;
      if (activeSubmenu === 'create' || activeSubmenu === 'history') return false;
      if (activeSubmenu === 'WORKING') {
        return t.status === 'WORKING' || t.status === 'PAUSED' || t.status === 'REVISION';
      }
      return t.status === activeSubmenu;
    });
  }, [tasks, activeSubmenu, searchQuery, priorityFilter]);

  // Handle task submission
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createAssignment({
      title: newTitle,
      clientName: newClient || 'Umum',
      documentType: newDocType,
      pageCount: Number(newPageCount),
      languageFrom: newLangFrom,
      languageTo: newLangTo,
      priority: newPriority,
      difficulty: newDifficulty,
      deadlineAt: newDeadline || new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      sourceFileName: newSourceFileName,
      sourceFileUrl: newSourceFileUrl,
      status: formStatus
    });

    // Reset Form
    setNewTitle('');
    setNewClient('');
    setNewDocType('General');
    setNewPageCount(5);
    setNewPriority('MEDIUM');
    setNewDifficulty('MEDIUM');
    setNewDeadline('');
  };

  const publishDraft = async (task: Task) => {
    confirmAction({
      title: 'Publikasikan Tugas?',
      message: `Publikasikan tugas "${task.title}" agar dapat diklaim oleh para penerjemah?`,
      type: 'success',
      confirmText: 'Publikasikan',
      onConfirm: async () => {
        await updateAssignment(task.id, { status: 'WAITING_CLAIM' });
      }
    });
  };

  const cancelTask = async (task: Task) => {
    confirmAction({
      title: 'Batalkan Tugas?',
      message: `Apakah Anda yakin ingin membatalkan tugas "${task.title}"? Status akan diubah menjadi Dibatalkan.`,
      type: 'danger',
      confirmText: 'Batalkan Tugas',
      onConfirm: async () => {
        await updateAssignment(task.id, { status: 'CANCELLED' });
      }
    });
  };

  const menuItems = [
    { id: 'all', label: 'Semua Task', icon: Layers, count: tasks.length },
    { id: 'create', label: 'Buat Baru', icon: Plus, count: null },
    { id: 'DRAFT', label: 'Draft', icon: FolderOpen, count: tasks.filter(t => t.status === 'DRAFT').length },
    { id: 'WAITING_CLAIM', label: 'Waiting Claim', icon: UserCheck, count: tasks.filter(t => t.status === 'WAITING_CLAIM').length },
    { id: 'WORKING', label: 'Working / Paused', icon: Clock, count: tasks.filter(t => t.status === 'WORKING' || t.status === 'PAUSED' || t.status === 'REVISION').length },
    { id: 'WAITING_REVIEW', label: 'Review', icon: FileCheck, count: tasks.filter(t => t.status === 'WAITING_REVIEW').length },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle, count: tasks.filter(t => t.status === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'Cancelled', icon: XCircle, count: tasks.filter(t => t.status === 'CANCELLED').length },
    { id: 'history', label: 'Riwayat Admin', icon: History, count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Upper header summary */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-500" />
            <span>Manajemen Siklus Tugas (Task Pool)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konsep Task Pool membolehkan translator FREE mengambil pekerjaan secara mandiri dan transparan.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveSubmenu('create');
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Task Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Submenu list */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl p-3 border border-[#F3E8F4] shadow-xs space-y-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">Sub Menu Task</p>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSubmenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubmenu(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-sm shadow-pink-200'
                      : 'text-slate-600 hover:bg-pink-50/50 hover:text-pink-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Content Pane */}
        <div className="lg:col-span-3">
          {activeSubmenu === 'create' ? (
            /* Task Creator View Form */
            <form onSubmit={handleCreateTask} className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4">
              <div className="border-b border-[#F3E8F4] pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800">Formulir Pembuatan Task Baru</h3>
                <p className="text-[10px] text-slate-400">Tugas akan langsung masuk ke Pool untuk diklaim jika statusnya WAITING_CLAIM</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Judul Dokumen / Nama Task *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Terjemahan Kontrak Hukum Vendor A"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Nama Klien / Instansi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. Maju Bersama"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Kategori / Bidang Dokumen</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 bg-white"
                  >
                    <option value="General">General (Umum)</option>
                    <option value="Legal">Legal (Hukum)</option>
                    <option value="Financial">Financial (Keuangan)</option>
                    <option value="Medical">Medical (Medis)</option>
                    <option value="Technical">Technical (Teknis)</option>
                    <option value="Academic">Academic (Akademik)</option>
                    <option value="Marketing">Marketing (Pemasaran)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Jumlah Halaman Dokumen *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newPageCount}
                    onChange={(e) => setNewPageCount(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Bahasa Sumber *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Inggris"
                    required
                    value={newLangFrom}
                    onChange={(e) => setNewLangFrom(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Bahasa Tujuan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Indonesia"
                    required
                    value={newLangTo}
                    onChange={(e) => setNewLangTo(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Prioritas Pengerjaan</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 bg-white"
                  >
                    <option value="LOW">LOW (Biasa)</option>
                    <option value="MEDIUM">MEDIUM (Sedang)</option>
                    <option value="HIGH">HIGH (Penting)</option>
                    <option value="URGENT">URGENT (Mendesak)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Tingkat Kesulitan (Pengali Poin)</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 bg-white"
                  >
                    <option value="EASY">EASY (Mudah - Multiplier 1.0)</option>
                    <option value="MEDIUM">MEDIUM (Normal - Multiplier 1.5)</option>
                    <option value="HARD">HARD (Sulit - Multiplier 2.0)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Tenggat Waktu (Deadline) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Tindakan Publikasi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 bg-white font-bold"
                  >
                    <option value="WAITING_CLAIM" className="text-emerald-600 font-bold">Publikasikan Ke Pool (Tersedia Klaim)</option>
                    <option value="DRAFT" className="text-slate-500 font-bold">Simpan Sebagai Draft</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500">Tautan File Dokumen Sumber (Google Drive)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={newSourceFileUrl}
                    onChange={(e) => setNewSourceFileUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSubmenu('all')}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Buat & Proses Task</span>
                </button>
              </div>
            </form>
          ) : activeSubmenu === 'history' ? (
            /* Audit Trail / Activity Log View */
            <div className="bg-white rounded-2xl border border-[#F3E8F4] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F3E8F4]">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="h-4 w-4 text-pink-500" />
                  <span>Riwayat Audit & Aktivitas Admin</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Audit trail lengkap pengerjaan task penerjemah dan keputusan admin</p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Belum ada riwayat aktivitas tercatat.</div>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex gap-3 text-xs text-slate-700">
                      <div className="bg-pink-50 text-pink-600 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                        <History className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-850">{log.action}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span className="font-bold text-slate-500">{log.userName}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Standard Submenu Task List */
            <div className="space-y-4">
              {/* Search & filters */}
              <div className="bg-white rounded-2xl p-4 border border-[#F3E8F4] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari judul, kode, penerjemah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-[10px] font-bold text-slate-450 uppercase hidden md:inline">Urutan Prioritas:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-pink-500 transition-colors cursor-pointer bg-white"
                  >
                    <option value="ALL">Semua Prioritas</option>
                    <option value="LOW">LOW (Biasa)</option>
                    <option value="MEDIUM">MEDIUM (Sedang)</option>
                    <option value="HIGH">HIGH (Tinggi)</option>
                    <option value="URGENT">URGENT (Mendesak)</option>
                  </select>
                </div>
              </div>

              {/* Task list render */}
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl py-16 text-center border border-[#F3E8F4] shadow-xs text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-slate-200" />
                  <div>
                    <p className="font-bold text-slate-550">Tidak ada tugas ditemukan</p>
                    <p className="text-[10px] text-slate-350 mt-0.5">Silakan pilih menu lain atau sesuaikan kata kunci pencarian</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl border border-[#F3E8F4] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Task Code & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold font-mono text-pink-500 bg-pink-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {task.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                        </div>

                        {/* Title & Client */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-pink-500 transition-colors">
                            {task.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Klien: {task.clientName}</p>
                        </div>

                        {/* Meta Grid details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-slate-50 py-2.5 my-1">
                          <div className="text-slate-500">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[8px]">Bahasa</span>
                            <span className="font-bold text-slate-700 block">{task.languageFrom} → {task.languageTo}</span>
                          </div>
                          <div className="text-slate-500">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[8px]">Poin & Halaman</span>
                            <span className="font-bold text-pink-600 block">{task.rewardPoints || task.calculatedPoints} Pt • {task.pageCount} hlm</span>
                          </div>
                          <div className="text-slate-500">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[8px]">Tingkat Kesulitan</span>
                            <span className="font-semibold text-slate-700 block">{task.difficulty || 'MEDIUM'}</span>
                          </div>
                          <div className="text-slate-500">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[8px]">Estimasi Waktu</span>
                            <span className="font-semibold text-slate-700 block">{task.estimatedMinutes} menit</span>
                          </div>
                        </div>

                        {/* Telemetry working stats if working or reviewed */}
                        {(task.status === 'WORKING' || task.status === 'PAUSED' || task.status === 'WAITING_REVIEW' || task.status === 'COMPLETED') && (
                          <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] text-slate-500 space-y-1 font-mono">
                            <div className="flex justify-between items-center">
                              <span>Penerjemah:</span>
                              <span className="font-bold text-slate-700">{task.translatorName || 'Tidak Diketahui'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Waktu Efektif:</span>
                              <span className="font-bold text-emerald-600">{formatClock(task.effectiveWorkSeconds || task.totalWorkingSeconds || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Durasi Pause:</span>
                              <span className="font-bold text-amber-500">{formatClock(task.totalPauseDuration || task.totalIdleSeconds || 0)}</span>
                            </div>
                            {task.pauseCount !== undefined && (
                              <div className="flex justify-between items-center">
                                <span>Jumlah Jeda:</span>
                                <span className="font-bold text-slate-655">{task.pauseCount}x</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Deadline */}
                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>Deadline: {formatDate(task.deadlineAt)}</span>
                        </div>
                      </div>

                      {/* Operations / Actions */}
                      <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3 mt-4">
                        {task.status === 'DRAFT' && (
                          <button
                            onClick={() => publishDraft(task)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                          >
                            Publikasikan
                          </button>
                        )}

                        {task.status === 'WAITING_REVIEW' && (
                          <button
                            onClick={() => setActiveReviewAssignment(task)}
                            className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          >
                            <FileCheck className="h-3 w-3" />
                            <span>Tinjau Hasil</span>
                          </button>
                        )}

                        {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                          <button
                            onClick={() => cancelTask(task)}
                            className="px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                          >
                            Batalkan
                          </button>
                        )}

                        <button
                          onClick={() => deleteAssignment(task.id)}
                          className="p-1.5 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
