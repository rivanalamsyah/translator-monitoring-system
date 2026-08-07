import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '../../context/AppContext';
import { X, FileText, Link as LinkIcon, AlertTriangle } from 'lucide-react';

const newAssignmentSchema = z.object({
  title: z.string().min(1, 'Judul dokumen harus diisi'),
  clientName: z.string().optional(),
  pageCount: z.number({ invalid_type_error: 'Harus berupa angka' }).min(1, 'Jumlah halaman minimal 1').max(500, 'Jumlah halaman maksimal 500'),
  languageFrom: z.string().min(1, 'Pasangan bahasa harus dipilih'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  sourceFileUrl: z.union([
    z.string().url('Tautan harus berupa URL yang valid (http/https)'),
    z.string().length(0)
  ]).optional(),
  status: z.enum(['AVAILABLE', 'DRAFT']),
});

type NewAssignmentForm = z.infer<typeof newAssignmentSchema>;

export const NewAssignmentModal: React.FC = () => {
  const {
    isNewAssignmentModalOpen,
    setIsNewAssignmentModalOpen,
    createAssignment,
    settings,
  } = useApp();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewAssignmentForm>({
    resolver: zodResolver(newAssignmentSchema),
    defaultValues: {
      title: '',
      clientName: '',
      pageCount: 10,
      languageFrom: settings.languageRules[0]?.languageCode || '',
      difficulty: 'MEDIUM',
      sourceFileUrl: '',
      status: 'AVAILABLE',
    },
  });

  if (!isNewAssignmentModalOpen) return null;

  const onSubmit = (data: NewAssignmentForm) => {
    const deadlineAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    createAssignment({
      title: data.title,
      clientName: data.clientName || 'Klien Umum',
      documentType: 'General',
      pageCount: data.pageCount,
      languageFrom: data.languageFrom,
      languageTo: 'Indonesia',
      priority: 'MEDIUM',
      sourceFileName: data.sourceFileUrl ? 'Tautan Dokumen Google Drive' : 'Dokumen_Sumber.pdf',
      sourceFileUrl: data.sourceFileUrl || '#',
      deadlineAt,
      difficulty: data.difficulty,
      status: data.status === 'AVAILABLE' ? 'WAITING_CLAIM' : 'DRAFT', // Fix: map to WAITING_CLAIM
    } as any);

    // Reset & close
    reset();
    setIsNewAssignmentModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Buat Tugas Baru</h2>
              <p className="text-xs text-slate-400">Tambahkan detail dokumen & tetapkan status tugas</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewAssignmentModalOpen(false)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Display errors if any */}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Harap perbaiki kesalahan berikut:
                </p>
                <ul className="list-disc list-inside">
                  {Object.values(errors).map((err, index) => (
                    <li key={index}>{err?.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
              
              {/* Title */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-600">Judul Dokumen *</label>
                <input
                  type="text"
                  placeholder="contoh: Perjanjian Hukum M&A Lintas Batas"
                  {...register('title')}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                    errors.title ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                  }`}
                />
              </div>

              {/* Document Link */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <LinkIcon className="h-3 w-3 text-pink-600" />
                  Tautan Google Drive Dokumen
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  {...register('sourceFileUrl')}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                    errors.sourceFileUrl ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                  }`}
                />
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Klien / Organisasi</label>
                <input
                  type="text"
                  placeholder="contoh: PT Telkom Indonesia Tbk"
                  {...register('clientName')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                />
              </div>

              {/* Language Pair */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Pasangan Bahasa</label>
                <select
                  {...register('languageFrom')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
                >
                  {settings.languageRules.map((rule) => (
                    <option key={rule.languageCode} value={rule.languageCode}>
                      {rule.languageName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tingkat Kesulitan</label>
                <select
                  {...register('difficulty')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
                >
                  <option value="EASY">Mudah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HARD">Sulit</option>
                </select>
              </div>

              {/* Page Count */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Jumlah Halaman</label>
                <input
                  type="number"
                  {...register('pageCount', { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 focus:outline-none focus:ring-1 transition-colors ${
                    errors.pageCount ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50' : 'border-slate-200 focus:border-pink-500 focus:ring-pink-500/50'
                  }`}
                />
              </div>
            </div>

            {/* Status Tugas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Status Tugas Saat Dibuat
              </label>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
              >
                <option value="AVAILABLE">Publikasikan Langsung ke Task Pool (Tersedia)</option>
                <option value="DRAFT">Simpan Sebagai Draft (Belum Tersedia untuk Penerjemah)</option>
              </select>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                reset();
                setIsNewAssignmentModalOpen(false);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-colors cursor-pointer"
            >
              Buat Tugas
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
