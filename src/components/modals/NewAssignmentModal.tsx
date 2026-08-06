import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FileText, Link } from 'lucide-react';

export const NewAssignmentModal: React.FC = () => {
  const {
    isNewAssignmentModalOpen,
    setIsNewAssignmentModalOpen,
    createAssignment,
    translators,
    settings,
  } = useApp();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [pageCount, setPageCount] = useState<number>(10);
  const [selectedLangRule, setSelectedLangRule] = useState(settings.languageRules[0]);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [sourceFileUrl, setSourceFileUrl] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'AVAILABLE'>('AVAILABLE');

  if (!isNewAssignmentModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const deadlineAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    createAssignment({
      title,
      clientName: clientName || 'Klien Umum',
      documentType: 'General',
      pageCount,
      languageFrom: selectedLangRule.languageCode,
      languageTo: 'Indonesia',
      priority: 'MEDIUM',
      sourceFileName: sourceFileUrl ? 'Tautan Dokumen Google Drive' : 'Dokumen_Sumber.pdf',
      sourceFileUrl: sourceFileUrl || '#',
      deadlineAt,
      difficulty,
      status: status === 'AVAILABLE' ? 'UNASSIGNED' : 'DRAFT', // map AVAILABLE to UNASSIGNED and DRAFT directly
    } as any);

    // Reset & close
    setTitle('');
    setClientName('');
    setPageCount(10);
    setSourceFileUrl('');
    setDifficulty('MEDIUM');
    setStatus('AVAILABLE');
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
              
              {/* Title */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-600">Judul Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Perjanjian Hukum M&A Lintas Batas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                />
              </div>

              {/* Document Link (GDrive) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Link className="h-3 w-3 text-pink-600" />
                  Tautan Google Drive Dokumen
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={sourceFileUrl}
                  onChange={(e) => setSourceFileUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Klien / Organisasi</label>
                <input
                  type="text"
                  placeholder="contoh: PT Telkom Indonesia Tbk"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                />
              </div>

              {/* Language Pair */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Pasangan Bahasa</label>
                <select
                  value={selectedLangRule.languageCode}
                  onChange={(e) => {
                    const rule = settings.languageRules.find((r) => r.languageCode === e.target.value);
                    if (rule) setSelectedLangRule(rule);
                  }}
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
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
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
                  min="1"
                  max="500"
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Status Tugas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Status Tugas Saat Dibuat
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
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
              onClick={() => setIsNewAssignmentModalOpen(false)}
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
