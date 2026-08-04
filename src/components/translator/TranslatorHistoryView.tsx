import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Star } from 'lucide-react';
import { formatDate, formatDuration } from '../../utils/formatters';

export const TranslatorHistoryView: React.FC = () => {
  const { currentTranslatorProfile, assignments } = useApp();

  if (!currentTranslatorProfile) return null;

  const completed = assignments.filter(
    (a) => a.translatorId === currentTranslatorProfile.id && a.status === 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>Riwayat Kerja & Arsip Terjemahan Selesai</span>
        </h2>
        <p className="text-xs text-slate-400">Riwayat proyek selesai, peringkat QA, dan telemetri kecepatan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Total Tugas Selesai</p>
          <p className="text-2xl font-black text-slate-800 font-mono">{completed.length + currentTranslatorProfile.completedJobsCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase text-slate-400">Rata-rata Peringkat Kualitas</p>
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-2xl font-black text-slate-800 font-mono">{currentTranslatorProfile.rating}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-400">Ketepatan Waktu SLA</p>
          <p className="text-2xl font-black text-emerald-600 font-mono">99.2%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800 bg-slate-50/50">
          Log Dokumen Selesai
        </div>

        <div className="divide-y divide-slate-100">
          {completed.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between text-xs text-slate-700">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold text-pink-600">{doc.code}</span>
                <h4 className="font-bold text-slate-800">{doc.title}</h4>
                <p className="text-[10px] text-slate-400">
                  {doc.pageCount} halaman ({doc.calculatedPoints} pt) • Disetujui pada {formatDate(doc.completedAt)}
                </p>
              </div>

              <div className="text-right space-y-1 font-mono">
                <p className="font-bold text-emerald-600">Disetujui</p>
                <p className="text-[10px] text-slate-400">{formatDuration(doc.totalWorkingSeconds)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
