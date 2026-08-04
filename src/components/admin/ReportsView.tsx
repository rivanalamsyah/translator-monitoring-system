import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, Award, FileCheck, Star } from 'lucide-react';
import { AvatarImage } from '../common/AvatarImage';

export const ReportsView: React.FC = () => {
  const { translators, assignments } = useApp();

  const totalPagesTranslated = assignments
    .filter((a) => a.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.pageCount, 0);

  const totalPointsCompleted = assignments
    .filter((a) => a.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.calculatedPoints, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-pink-600" />
          <span>Laporan Kinerja & Analisis Penerjemah</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Metrik waktu penyelesaian, volume penyelesaian, peringkat kualitas, dan tingkat revisi di seluruh tim
        </p>
      </div>

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Halaman Diterjemahkan</span>
            <FileCheck className="h-4 w-4 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{totalPagesTranslated}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">+18.4% vs bulan lalu</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Poin Diselesaikan</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{totalPointsCompleted} pt</div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% kepatuhan SLA</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Rata-rata Peringkat Kualitas</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">4.91 / 5.0</div>
          <p className="text-[11px] text-slate-400">Berdasarkan umpan balik klien & QA</p>
        </div>
      </div>

      {/* Translator Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award className="h-4 w-4 text-pink-600" />
          <span>Papan Peringkat & Efisiensi Penerjemah</span>
        </h3>

        <div className="space-y-3">
          {translators.map((tr, idx) => (
            <div
              key={tr.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white font-black text-xs font-mono">
                  #{idx + 1}
                </span>
                <AvatarImage src={tr.avatar} name={tr.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{tr.name}</h4>
                  <p className="text-[10px] text-slate-400">{tr.languages.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono">
                <div className="text-right">
                  <p className="font-bold text-slate-800">{tr.completedJobsCount} Tugas</p>
                  <p className="text-[10px] text-slate-400">Selesai</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600 flex items-center justify-end gap-0.5">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                    <span>{tr.rating}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Skor Peringkat</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
