import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, Languages, Lock, AlertTriangle } from 'lucide-react';

const newTranslatorSchema = z.object({
  name: z.string().min(1, 'Nama lengkap harus diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(1, 'Nomor telepon harus diisi'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  maxCapacityPoints: z.number({ invalid_type_error: 'Harus berupa angka' }).min(5, 'Kapasitas minimal 5 halaman').max(100, 'Kapasitas maksimal 100 halaman'),
});

type NewTranslatorForm = z.infer<typeof newTranslatorSchema>;

export const NewTranslatorModal: React.FC = () => {
  const { isNewTranslatorModalOpen, setIsNewTranslatorModalOpen, addTranslator, settings } = useApp();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['EN-ID']);
  const [langError, setLangError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewTranslatorForm>({
    resolver: zodResolver(newTranslatorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      maxCapacityPoints: 20,
    },
  });

  if (!isNewTranslatorModalOpen) return null;

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      if (next.length > 0) {
        setLangError('');
      }
      return next;
    });
  };

  const onSubmit = async (data: NewTranslatorForm) => {
    if (selectedLanguages.length === 0) {
      setLangError('Pilih minimal satu bahasa yang dikuasai.');
      return;
    }

    try {
      await addTranslator({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password.trim(),
        phone: data.phone.trim(),
        languages: selectedLanguages,
        maxCapacityPoints: data.maxCapacityPoints,
      });

      reset();
      setSelectedLanguages(['EN-ID']);
      setLangError('');
      setIsNewTranslatorModalOpen(false);
    } catch (err) {
      // Error is handled inside AppContext
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Daftarkan Penerjemah</h2>
              <p className="text-xs text-slate-400">Tambahkan profil penerjemah baru & buat akun masuk</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewTranslatorModalOpen(false)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Display errors if any */}
            {(Object.keys(errors).length > 0 || langError) && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Harap perbaiki kesalahan berikut:
                </p>
                <ul className="list-disc list-inside">
                  {Object.values(errors).map((err, index) => (
                    <li key={index}>{err?.message}</li>
                  ))}
                  {langError && <li>{langError}</li>}
                </ul>
              </div>
            )}

            {/* Nama */}
            <div className="space-y-1 text-slate-700">
              <label className="text-xs font-semibold text-slate-600">Nama Lengkap *</label>
              <input
                type="text"
                placeholder="contoh: Maya Lin"
                {...register('name')}
                className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                }`}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-755">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Alamat Email *</label>
                <input
                  type="email"
                  placeholder="penerjemah@email.com"
                  {...register('email')}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                    errors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nomor Telepon *</label>
                <input
                  type="text"
                  placeholder="+62 8xx-xxxx-xxxx"
                  {...register('phone')}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                    errors.phone ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1 text-slate-700">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Lock className="h-3 w-3 text-pink-600" />
                Kata Sandi Akun *
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                {...register('password')}
                className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                }`}
              />
            </div>

            {/* Capacity */}
            <div className="space-y-1 text-slate-700">
              <label className="text-xs font-semibold text-slate-600">
                Kapasitas Halaman Maksimal
              </label>
              <input
                type="number"
                {...register('maxCapacityPoints', { valueAsNumber: true })}
                className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-855 focus:outline-none focus:ring-1 transition-colors ${
                  errors.maxCapacityPoints ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                }`}
              />
              <p className="text-[10px] text-slate-400">
                Kapasitas standar adalah 20 halaman.
              </p>
            </div>

            {/* Languages */}
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
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                reset();
                setSelectedLanguages(['EN-ID']);
                setLangError('');
                setIsNewTranslatorModalOpen(false);
              }}
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
