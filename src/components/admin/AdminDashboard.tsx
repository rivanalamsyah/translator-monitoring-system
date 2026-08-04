import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  FileCheck,
  Clock,
  Plus,
  ArrowUpRight,
  Search,
  Star,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatClock } from '../../utils/formatters';
import { AvatarImage } from '../common/AvatarImage';

export const AdminDashboard: React.FC = () => {
  const {
    translators,
    assignments,
    setIsNewAssignmentModalOpen,
    setIsNewTranslatorModalOpen,
    setActiveReviewAssignment,
    setAdminTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter translators
  const filteredTranslators = useMemo(() => {
    return translators.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [translators, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-pink-600 via-pink-700 to-rose-600 text-white rounded-2xl p-6 shadow-md border border-pink-700/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-pink-100 uppercase tracking-wider">
              Pusat Kendali Sistem
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Operasi Penerjemah Riil</h2>
          <p className="text-xs text-pink-100/90 max-w-xl">
            Pemantauan telemetri langsung untuk pengukur waktu penerjemah aktif, distribusi poin beban kerja, tenggat waktu, dan siklus hidup penugasan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewAssignmentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-pink-50 px-4 py-2 text-xs font-bold text-pink-700 shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Penugasan Baru</span>
          </button>
          <button
            onClick={() => setIsNewTranslatorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span>Tambah Penerjemah</span>
          </button>
        </div>
      </div>

      {/* Main Section: Real-time Command Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-600" />
              <span>Tabel Operasi Langsung Penerjemah</span>
            </h3>
            <p className="text-xs text-slate-400">Pemantau timer riil, kalkulasi status & utilisasi beban kerja</p>
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari penerjemah atau bahasa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-pink-500 transition-colors"
            >
              <option value="ALL">Semua Status</option>
              <option value="READY">Siap Kerja</option>
              <option value="WORKING">Sedang Mengerjakan</option>
              <option value="PAUSED">Ditangguhkan</option>
              <option value="WAITING_REVIEW">Menunggu Tinjauan</option>
              <option value="REVISION">Revisi</option>
              <option value="ON_LEAVE">Sedang Cuti</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Penerjemah</th>
                  <th className="py-3 px-3">Bahasa</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Timer</th>
                  <th className="py-3 px-3">Tenggat</th>
                  <th className="py-3 px-3">Beban Kerja</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTranslators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-slate-400 text-xs">
                      Tidak ada penerjemah aktif yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTranslators.map((tr) => {
                    // Find current active assignment
                    const activeAss = assignments.find((a) => a.id === tr.activeAssignmentId);

                    return (
                      <tr
                        key={tr.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Translator Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <AvatarImage
                              src={tr.avatar}
                              name={tr.name}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-800 leading-snug">
                                {tr.name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                                <span>{tr.rating} &bull; {tr.completedJobsCount} selesai</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Languages */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {tr.languages.map((lang) => (
                              <span
                                key={lang}
                                className="rounded bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-600 border border-pink-100/50"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Computed Status Badge */}
                        <td className="py-3 px-3">
                          <StatusBadge status={tr.status} size="sm" />
                        </td>

                        {/* Live Timer Counter */}
                        <td className="py-3 px-3">
                          {activeAss ? (
                            <div className="font-mono text-xs font-bold text-pink-600 flex items-center gap-1">
                              <Clock className="h-3 w-3 animate-spin shrink-0 text-pink-500" />
                              <span>{formatClock(activeAss.totalWorkingSeconds)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Deadline */}
                        <td className="py-3 px-3">
                          {activeAss ? (
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-slate-700 truncate max-w-[100px]">
                                {new Date(activeAss.deadlineAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <PriorityBadge priority={activeAss.priority} />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Tidak ada tugas</span>
                          )}
                        </td>

                        {/* Workload Capacity Progress Bar */}
                        <td className="py-3 px-3">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-slate-500">
                                {tr.currentLoadPoints} / {tr.maxCapacityPoints} pt
                              </span>
                              <span
                                className={
                                  tr.utilizationPercentage > 80
                                    ? 'text-rose-600 font-bold'
                                    : 'text-slate-400'
                                }
                              >
                                {tr.utilizationPercentage}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  tr.utilizationPercentage > 80
                                    ? 'bg-rose-500'
                                    : tr.utilizationPercentage > 50
                                    ? 'bg-amber-500'
                                    : 'bg-pink-500'
                                }`}
                                style={{ width: `${tr.utilizationPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          {activeAss?.status === 'WAITING_REVIEW' ? (
                            <button
                              onClick={() => setActiveReviewAssignment(activeAss)}
                              className="inline-flex items-center gap-1 rounded bg-purple-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-purple-700 cursor-pointer"
                            >
                              <FileCheck className="h-3 w-3" />
                              <span>Tinjau</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setAdminTab('assignments')}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-pink-600 transition-colors cursor-pointer"
                            >
                              <span>Kelola</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
