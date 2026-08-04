import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Save, Languages, Shield } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [languageRules, setLanguageRules] = useState(settings.languageRules);
  const [autoAssign] = useState(settings.autoAssignEnabled);
  const [defaultCapacity, setDefaultCapacity] = useState(settings.defaultCapacityPoints);
  const [overdueThreshold, setOverdueThreshold] = useState(settings.overdueAlertThresholdMinutes);
  const [saved, setSaved] = useState(false);

  const handleMultiplierChange = (code: string, newPoints: number) => {
    setLanguageRules((prev) =>
      prev.map((r) => (r.languageCode === code ? { ...r, pointsPerPage: newPoints } : r))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      languageRules,
      autoAssignEnabled: autoAssign,
      defaultCapacityPoints: defaultCapacity,
      overdueAlertThresholdMinutes: overdueThreshold,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="h-5 w-5 text-pink-600" />
            <span>Konfigurasi Sistem & Pengali Poin</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasikan aturan poin kesulitan bahasa, ambang batas kapasitas, dan otomatisasi
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{saved ? 'Berhasil Disimpan!' : 'Simpan Konfigurasi'}</span>
        </button>
      </div>

      {/* Language Multipliers Configuration */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Languages className="h-4 w-4 text-pink-600" />
          <span>Pengali Poin Kesulitan Bahasa (Poin per Halaman)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languageRules.map((rule) => (
            <div
              key={rule.languageCode}
              className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">{rule.languageName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{rule.languageCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5.0"
                  value={rule.pointsPerPage}
                  onChange={(e) => handleMultiplierChange(rule.languageCode, parseFloat(e.target.value) || 1.0)}
                  className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-center text-pink-600 focus:outline-none focus:border-pink-500"
                />
                <span className="text-xs font-bold text-slate-500">pt/hlm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds & Defaults */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Shield className="h-4 w-4 text-pink-600" />
          <span>Kapasitas & Ambang Batas Sistem</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Batas Kapasitas Default Penerjemah (Poin)
            </label>
            <input
              type="number"
              value={defaultCapacity}
              onChange={(e) => setDefaultCapacity(parseInt(e.target.value) || 20)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Ambang Batas Peringatan Terlambat (Menit sebelum tenggat waktu)
            </label>
            <input
              type="number"
              value={overdueThreshold}
              onChange={(e) => setOverdueThreshold(parseInt(e.target.value) || 60)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
