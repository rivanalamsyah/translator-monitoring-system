import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Trash2,
  Languages,
  Phone,
  Mail,
  PieChart,
  Star,
  Search,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { AvatarImage } from '../common/AvatarImage';

export const TranslatorsList: React.FC = () => {
  const { translators, deleteTranslator, setIsNewTranslatorModalOpen } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTranslators = useMemo(() => {
    return translators.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [translators, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            <span>Direktori Penerjemah & Kapasitas Beban Kerja</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola penerjemah aktif, kompetensi bahasa, batas kapasitas, dan skor kinerja
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari penerjemah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsNewTranslatorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Daftarkan Penerjemah</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTranslators.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
          Penerjemah tidak ditemukan berdasarkan pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTranslators.map((tr) => (
            <div
              key={tr.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-pink-500/40 transition-all space-y-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarImage
                    src={tr.avatar}
                    name={tr.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{tr.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{tr.rating}</span>
                      <span className="text-slate-400">({tr.completedJobsCount} selesai)</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={tr.status} size="sm" />
              </div>

              {/* Contact details */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{tr.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{tr.phone}</span>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Languages className="h-3 w-3 text-pink-500" />
                  Bahasa yang Dikuasai
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tr.languages.map((l) => (
                    <span
                      key={l}
                      className="rounded bg-pink-50 text-pink-600 border border-pink-100/50 px-2 py-0.5 text-xs font-semibold"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload Progress */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <PieChart className="h-3.5 w-3.5 text-pink-500" />
                    Beban Kerja
                  </span>
                  <span className="text-slate-800 font-mono">
                    {tr.currentLoadPoints} / {tr.maxCapacityPoints} pt
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
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
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Tersisa: {tr.remainingCapacityPoints} pt</span>
                  <span>{tr.utilizationPercentage}% Terisi</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => deleteTranslator(tr.id)}
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus Penerjemah"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
