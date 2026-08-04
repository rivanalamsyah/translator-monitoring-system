import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Play, UploadCloud } from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';

export const MyAssignmentsView: React.FC = () => {
  const {
    currentTranslatorProfile,
    assignments,
    startAssignmentTimer,
    setActiveSubmitAssignment,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!currentTranslatorProfile) return null;

  // STRICT ISOLATION: Show ONLY assignments belonging to this translator!
  const myAssignments = assignments.filter((a) => a.translatorId === currentTranslatorProfile.id);

  const filtered = myAssignments.filter((a) => statusFilter === 'ALL' || a.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-600" />
            <span>Daftar Tugas Saya</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ruang kerja penugasan pribadi untuk {currentTranslatorProfile.name}
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-pink-500 transition-colors"
        >
          <option value="ALL">Semua Status Saya</option>
          <option value="ASSIGNED">Ditugaskan</option>
          <option value="WORKING">Sedang Dikerjakan</option>
          <option value="PAUSED">Ditangguhkan</option>
          <option value="WAITING_REVIEW">Menunggu Tinjauan</option>
          <option value="REVISION">Revisi</option>
          <option value="COMPLETED">Selesai</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-pink-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-pink-600">{a.code}</span>
              <StatusBadge status={a.status} size="sm" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm">{a.title}</h3>
              <p className="text-xs text-slate-400">Klien: {a.clientName}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Bahasa</p>
                <p className="font-semibold text-slate-700">{a.languageFrom}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Halaman</p>
                <p className="font-semibold text-slate-700">{a.pageCount} hlm</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Poin</p>
                <p className="font-bold text-pink-600 font-mono">{a.calculatedPoints} pt</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Tenggat: {formatDate(a.deadlineAt)}</span>

              <div className="flex items-center gap-2">
                {a.status === 'ASSIGNED' && (
                  <button
                    onClick={() => startAssignmentTimer(a.id)}
                    className="flex items-center gap-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-md shadow-pink-600/10 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Mulai Kerja</span>
                  </button>
                )}

                {(a.status === 'WORKING' || a.status === 'PAUSED' || a.status === 'REVISION') && (
                  <button
                    onClick={() => setActiveSubmitAssignment(a)}
                    className="flex items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-md shadow-purple-600/10 cursor-pointer"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Kirim</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
