import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Save,
  Languages,
  Shield,
  Award,
  Calendar,
  Bell,
  Database,
  Plus,
  Trash2,
  Lock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, confirmAction } = useApp();

  const [languageRules, setLanguageRules] = useState(settings.languageRules || []);
  const [defaultCapacity, setDefaultCapacity] = useState(settings.defaultCapacityPoints);
  const [overdueThreshold, setOverdueThreshold] = useState(settings.overdueAlertThresholdMinutes);
  const [emailNotif, setEmailNotif] = useState(settings.emailNotificationsEnabled);
  const [pushNotif, setPushNotif] = useState(settings.pushNotificationsEnabled);

  // Point rules config
  const [basePoints, setBasePoints] = useState(settings.pointRules?.basePointsPerPage || 10);
  const [easyMult, setEasyMult] = useState(settings.pointRules?.difficultyMultipliers?.EASY || 1.0);
  const [medMult, setMedMult] = useState(settings.pointRules?.difficultyMultipliers?.MEDIUM || 1.5);
  const [hardMult, setHardMult] = useState(settings.pointRules?.difficultyMultipliers?.HARD || 2.0);
  const [speedBonus, setSpeedBonus] = useState(settings.pointRules?.speedBonusPoints || 5);
  const [revisionPenalty, setRevisionPenalty] = useState(settings.pointRules?.revisionPenaltyPoints || 2);

  const [saved, setSaved] = useState(false);

  // Add new language state
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangPoints, setNewLangPoints] = useState(1);

  // Holidays state
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([
    { date: '2026-08-17', name: 'Hari Kemerdekaan RI' },
    { date: '2026-12-25', name: 'Hari Raya Natal' }
  ]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddLanguage = () => {
    if (!newLangCode || !newLangName) return;
    setLanguageRules([
      ...languageRules,
      { languageCode: newLangCode, languageName: newLangName, pointsPerPage: Number(newLangPoints) }
    ]);
    setNewLangCode('');
    setNewLangName('');
  };

  const handleRemoveLanguage = (code: string) => {
    setLanguageRules(languageRules.filter(r => r.languageCode !== code));
  };

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName) return;
    setHolidays([...holidays, { date: newHolidayDate, name: newHolidayName }]);
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const handleRemoveHoliday = (idx: number) => {
    setHolidays(holidays.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmAction({
      title: 'Simpan Konfigurasi Sistem?',
      message: 'Apakah Anda yakin ingin menyimpan perubahan pengaturan sistem ini?',
      type: 'warning',
      confirmText: 'Simpan',
      successTitle: 'Pengaturan Disimpan!',
      successMessage: 'Pengaturan sistem berhasil disimpan dan diterapkan.',
      onConfirm: async () => {
        await updateSettings({
          ...settings,
          autoAssignEnabled: settings.autoAssignEnabled,
          defaultCapacityPoints: defaultCapacity,
          overdueAlertThresholdMinutes: overdueThreshold,
          languageRules,
          emailNotificationsEnabled: emailNotif,
          pushNotificationsEnabled: pushNotif,
          pointRules: {
            basePointsPerPage: basePoints,
            difficultyMultipliers: { EASY: easyMult, MEDIUM: medMult, HARD: hardMult },
            speedBonusPoints: speedBonus,
            qualityBonusPoints: settings.pointRules?.qualityBonusPoints || 5,
            revisionPenaltyPoints: revisionPenalty,
            latePenaltyPoints: settings.pointRules?.latePenaltyPoints || 5
          }
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Banner and Save buttons */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="h-5 w-5 text-pink-500" />
            <span>Konfigurasi Global & Pengaturan Sistem</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data master, aturan poin gamifikasi, notifikasi, hari libur, dan manajemen hak akses.
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer hover:shadow-md"
        >
          <Save className="h-4 w-4" />
          <span>{saved ? 'Berhasil Disimpan!' : 'Simpan Konfigurasi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aturan Poin Gamification */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Award className="h-4 w-4 text-pink-500" />
            <span>Skema Perhitungan & Aturan Poin</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Base Points per Halaman</label>
                <input
                  type="number"
                  value={basePoints}
                  onChange={(e) => setBasePoints(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Bonus Selesai Cepat (Poin)</label>
                <input
                  type="number"
                  value={speedBonus}
                  onChange={(e) => setSpeedBonus(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Pengali Kesulitan (Difficulty Multiplier)</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">EASY</label>
                  <input
                    type="number"
                    step="0.1"
                    value={easyMult}
                    onChange={(e) => setEasyMult(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">MEDIUM</label>
                  <input
                    type="number"
                    step="0.1"
                    value={medMult}
                    onChange={(e) => setMedMult(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">HARD</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hardMult}
                    onChange={(e) => setHardMult(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Penalti Pengajuan Revisi (Pengurang Poin)</label>
              <input
                type="number"
                value={revisionPenalty}
                onChange={(e) => setRevisionPenalty(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Master Data Bahasa */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Languages className="h-4 w-4 text-pink-500" />
            <span>Master Pasangan Bahasa & Point Rule</span>
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {languageRules.map((rule) => (
              <div
                key={rule.languageCode}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 bg-slate-50"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{rule.languageName}</p>
                  <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">{rule.languageCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(rule.languageCode)}
                  className="p-1 text-slate-450 hover:text-red-500 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add language inputs */}
          <div className="bg-[#FFF8FB] rounded-xl p-3 border border-[#FDF0F6] space-y-2">
            <p className="text-[10px] font-bold text-pink-600 uppercase">Tambah Pasangan Bahasa Baru</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Kode (contoh: EN-ID)"
                value={newLangCode}
                onChange={(e) => setNewLangCode(e.target.value)}
                className="text-[11px] border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500"
              />
              <input
                type="text"
                placeholder="Nama (contoh: Inggris ke Indonesia)"
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                className="text-[11px] border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddLanguage}
              className="w-full text-center py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              Simpan Bahasa
            </button>
          </div>
        </div>

        {/* Ambang Batas Kapasitas & Telemetri */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Shield className="h-4 w-4 text-pink-500" />
            <span>Kapasitas Default & Keamanan</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Kapasitas Beban Default (Halaman)</label>
              <input
                type="number"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Peringatan Terlambat (Menit)</label>
              <input
                type="number"
                value={overdueThreshold}
                onChange={(e) => setOverdueThreshold(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Master Hari Libur */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Calendar className="h-4 w-4 text-pink-500" />
            <span>Master Hari Libur Nasional</span>
          </h3>

          <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
            {holidays.map((h, i) => (
              <div key={h.date} className="flex items-center justify-between rounded-xl border border-slate-100 p-2 bg-slate-50 text-[11px]">
                <div>
                  <span className="font-bold text-slate-800">{h.name}</span>
                  <span className="font-mono text-slate-400 block">{h.date}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(i)}
                  className="p-1 text-slate-450 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-[#FFF8FB] border border-[#FDF0F6] rounded-xl p-3 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="text-[11px] border border-slate-200 bg-white rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Nama Hari Libur"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              className="text-[11px] border border-slate-200 bg-white rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddHoliday}
              className="col-span-2 text-center py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              Simpan Hari Libur
            </button>
          </div>
        </div>

        {/* Hak Akses RBAC Permission Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-[#F3E8F4] shadow-xs space-y-4 lg:col-span-2">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Lock className="h-4 w-4 text-pink-500" />
            <span>Matriks Hak Akses (Role-Based Access Control)</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                  <th className="py-2.5 px-4">Menu Aplikasi</th>
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
                  <th className="py-2.5 px-3 text-center">Penerjemah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                {[
                  { menu: 'Dashboard Utama', admin: true, translator: true },
                  { menu: 'Daftar & Pembuatan Task Pool', admin: true, translator: false },
                  { menu: 'Klaim Pekerjaan & Workspace Timer', admin: false, translator: true },
                  { menu: 'Manajemen Akun Penerjemah', admin: true, translator: false },
                  { menu: 'Papan Peringkat (Leaderboard)', admin: true, translator: true },
                  { menu: 'Unduh Excel & Laporan PDF', admin: true, translator: false },
                  { menu: 'Konfigurasi Sistem Global', admin: true, translator: false }
                ].map((row) => (
                  <tr key={row.menu} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-655">{row.menu}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">{row.admin ? 'Akses Penuh' : '-'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {row.translator ? (row.menu.includes('Workspace') ? 'Klaim & Kelola Waktu' : 'Akses Terbatas') : 'Tidak Ada Akses'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  );
};
