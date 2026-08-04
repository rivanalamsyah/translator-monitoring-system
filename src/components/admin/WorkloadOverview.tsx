import React from 'react';
import { useApp } from '../../context/AppContext';
import { PieChart, Languages } from 'lucide-react';
import { AvatarImage } from '../common/AvatarImage';

export const WorkloadOverview: React.FC = () => {
  const { translators, settings } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-pink-600" />
          <span>Mesin Distribusi Poin & Beban Kerja Penerjemah</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Rumus: <span className="font-mono font-bold text-pink-600">Poin Beban Kerja = Total Halaman × Pengali Bahasa</span>. Penerjemah memiliki batas kapasitas untuk menjamin kualitas terjemahan.
        </p>
      </div>

      {/* Language Multipliers Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Languages className="h-4 w-4 text-pink-600" />
          <span>Referensi Aturan Pengali Bahasa</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {settings.languageRules.map((rule) => (
            <div
              key={rule.languageCode}
              className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">{rule.languageName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{rule.languageCode}</p>
              </div>
              <span className="font-mono font-black text-sm text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg">
                {rule.pointsPerPage} pt/hlm
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Capacity Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800 bg-slate-50/50">
          Kapasitas Beban Kerja & Utilisasi Penerjemah Individu
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nama Penerjemah</th>
                <th className="py-3 px-3">Bahasa yang Dikuasai</th>
                <th className="py-3 px-3">Kapasitas Maksimal</th>
                <th className="py-3 px-3">Beban Saat Ini</th>
                <th className="py-3 px-3">Tersisa</th>
                <th className="py-3 px-3">Utilisasi</th>
                <th className="py-3 px-4">Pengukur Kapasitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {translators.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <AvatarImage src={t.avatar} name={t.name} className="h-7 w-7 rounded-full object-cover" />
                    <span>{t.name}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-medium text-slate-600">{t.languages.join(', ')}</span>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                    {t.maxCapacityPoints} pt
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-pink-600">
                    {t.currentLoadPoints} pt
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                    {t.remainingCapacityPoints} pt
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold">
                    <span
                      className={
                        t.utilizationPercentage > 80
                          ? 'text-rose-600'
                          : t.utilizationPercentage > 50
                          ? 'text-amber-600'
                          : 'text-pink-600'
                      }
                    >
                      {t.utilizationPercentage}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="w-36 space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.utilizationPercentage > 80
                              ? 'bg-rose-500'
                              : t.utilizationPercentage > 50
                              ? 'bg-amber-500'
                              : 'bg-pink-500'
                          }`}
                          style={{ width: `${t.utilizationPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
