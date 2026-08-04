import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, Languages } from 'lucide-react';

export const NewTranslatorModal: React.FC = () => {
  const { isNewTranslatorModalOpen, setIsNewTranslatorModalOpen, addTranslator, settings } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxCapacityPoints, setMaxCapacityPoints] = useState<number>(20);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['EN-ID']);

  if (!isNewTranslatorModalOpen) return null;

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTranslator({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@translator.id`,
      phone: phone || '+62 812-0000-0000',
      languages: selectedLanguages.length > 0 ? selectedLanguages : ['EN-ID'],
      maxCapacityPoints,
    });

    setName('');
    setEmail('');
    setPhone('');
    setIsNewTranslatorModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Daftarkan Penerjemah</h2>
              <p className="text-xs text-slate-400">Tambahkan profil penerjemah baru & kapasitas beban kerja</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewTranslatorModalOpen(false)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1 text-slate-700">
            <label className="text-xs font-semibold text-slate-600">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="contoh: Maya Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-slate-755">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Alamat Email</label>
              <input
                type="email"
                placeholder="maya@translator.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Nomor Telepon</label>
              <input
                type="text"
                placeholder="+62 812-1122-3344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 text-slate-700">
            <label className="text-xs font-semibold text-slate-600">
              Poin Kapasitas Beban Kerja Maksimal
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={maxCapacityPoints}
              onChange={(e) => setMaxCapacityPoints(parseInt(e.target.value) || 20)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
            />
            <p className="text-[10px] text-slate-400">
              Kapasitas standar adalah 20 poin (~20 halaman bahasa Inggris atau 10 halaman bahasa Jepang).
            </p>
          </div>

          <div className="space-y-2 text-slate-700">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-pink-600" />
              Bahasa yang Dikuasai
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {settings.languageRules.map((rule) => {
                const isSelected = selectedLanguages.includes(rule.languageCode);
                return (
                  <button
                    key={rule.languageCode}
                    type="button"
                    onClick={() => toggleLanguage(rule.languageCode)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-600 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <span>{rule.languageCode}</span>
                    <span className="text-[10px] opacity-80">{rule.pointsPerPage}x</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTranslatorModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-colors cursor-pointer"
            >
              Daftarkan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
