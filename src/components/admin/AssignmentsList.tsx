import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  UserCheck,
  Trash2,
  FileCheck,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatDate, formatDocumentType } from '../../utils/formatters';

export const AssignmentsList: React.FC = () => {
  const {
    assignments,
    translators,
    deleteAssignment,
    reassignAssignment,
    setIsNewAssignmentModalOpen,
    setActiveReviewAssignment,
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reassigningDocId, setReassigningDocId] = useState<string | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-600" />
            <span>Siklus Hidup Penugasan Terjemahan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pantau, tetapkan, alihkan, dan audit semua dokumen melalui alur persetujuan
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-50 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-pink-600 font-semibold' : 'text-slate-400'
              }`}
              title="Tampilan Tabel"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-pink-600 font-semibold' : 'text-slate-400'
              }`}
              title="Tampilan Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kode atau dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-pink-500 transition-colors"
          >
            <option value="ALL">Semua Status</option>
            <option value="UNASSIGNED">Belum Ditugaskan</option>
            <option value="ASSIGNED">Ditugaskan</option>
            <option value="WORKING">Sedang Dikerjakan</option>
            <option value="PAUSED">Ditangguhkan</option>
            <option value="WAITING_REVIEW">Menunggu Tinjauan</option>
            <option value="REVISION">Revisi</option>
            <option value="COMPLETED">Selesai</option>
          </select>

          <button
            onClick={() => setIsNewAssignmentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Penugasan Baru</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Kode & Judul Dokumen</th>
                  <th className="py-3 px-3">Tipe & Halaman</th>
                  <th className="py-3 px-3">Poin Beban Kerja</th>
                  <th className="py-3 px-3">Penerjemah</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Prioritas</th>
                  <th className="py-3 px-3">Tenggat Waktu</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-slate-400 text-xs">
                      Tidak ada penugasan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-pink-600">
                            {a.code}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs truncate">{a.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{a.clientName}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-semibold text-slate-700">{formatDocumentType(a.documentType)}</span>
                          <p className="text-[10px] text-slate-400">
                            {a.pageCount} halaman ({a.languageFrom})
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-pink-600">
                          {a.calculatedPoints} pt
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {reassigningDocId === a.id ? (
                          <select
                            autoFocus
                            onChange={(e) => {
                              if (e.target.value) {
                                const targetTr = translators.find((t) => t.id === e.target.value);
                                if (targetTr && targetTr.remainingCapacityPoints < a.calculatedPoints) {
                                  const confirmProceed = confirm(
                                    `Peringatan: Penerjemah ${targetTr.name} hanya memiliki sisa kapasitas ${targetTr.remainingCapacityPoints} pt, sedangkan penugasan ini memerlukan ${a.calculatedPoints} pt.\n\nApakah Anda tetap ingin mengalihkan penugasan?`
                                  );
                                  if (!confirmProceed) {
                                    setReassigningDocId(null);
                                    return;
                                  }
                                }
                                reassignAssignment(a.id, e.target.value);
                                setReassigningDocId(null);
                              }
                            }}
                            onBlur={() => setReassigningDocId(null)}
                            className="rounded-lg border border-pink-500 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none"
                          >
                            <option value="">Pilih Penerjemah...</option>
                            {translators.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} (Sisa: {t.remainingCapacityPoints} pt)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            onClick={() => setReassigningDocId(a.id)}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-pink-600 transition-colors"
                          >
                            <span className="font-medium text-slate-700">
                              {a.translatorName || 'Belum Ditugaskan'}
                            </span>
                            <UserCheck className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={a.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-3">
                        <PriorityBadge priority={a.priority} />
                      </td>

                      <td className="py-3.5 px-3 text-[11px] font-mono text-slate-500">
                        {formatDate(a.deadlineAt)}
                      </td>

                      <td className="py-3.5 px-3 text-right space-x-1">
                        {a.status === 'WAITING_REVIEW' && (
                          <button
                            onClick={() => setActiveReviewAssignment(a)}
                            className="rounded bg-purple-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-purple-700 cursor-pointer"
                          >
                            Tinjau
                          </button>
                        )}
                        <button
                          onClick={() => deleteAssignment(a.id)}
                          className="rounded p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {[
            { status: 'UNASSIGNED', label: 'Belum Ditugaskan' },
            { status: 'WORKING', label: 'Sedang Dikerjakan' },
            { status: 'WAITING_REVIEW', label: 'Menunggu Tinjauan' },
            { status: 'COMPLETED', label: 'Selesai' },
          ].map((col) => {
            const colItems = filteredAssignments.filter((a) => {
              if (col.status === 'WORKING') return a.status === 'WORKING' || a.status === 'ASSIGNED' || a.status === 'PAUSED' || a.status === 'REVISION';
              return a.status === col.status;
            });

            return (
              <div key={col.status} className="rounded-xl bg-slate-50/50 border border-slate-200 p-4 space-y-3 min-w-[260px] flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2 hover:border-pink-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-pink-600">
                          {item.code}
                        </span>
                        <PriorityBadge priority={item.priority} />
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs">{item.title}</h4>
                      <p className="text-[10px] text-slate-400">{item.clientName}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 font-medium">{item.translatorName || 'Belum Ditugaskan'}</span>
                        <span className="font-mono font-bold text-pink-600">{item.calculatedPoints} pt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
