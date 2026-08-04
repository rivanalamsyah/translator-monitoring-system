import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FileText, Sparkles } from 'lucide-react';
import { Priority } from '../../types';

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
  const [documentType, setDocumentType] = useState<any>('Legal');
  const [pageCount, setPageCount] = useState<number>(10);
  const [selectedLangRule, setSelectedLangRule] = useState(settings.languageRules[0]);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [translatorId, setTranslatorId] = useState<string>('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [deadlineHours, setDeadlineHours] = useState<number>(24);

  if (!isNewAssignmentModalOpen) return null;

  // Calculate workload points live
  const calculatedPoints = parseFloat((pageCount * selectedLangRule.pointsPerPage).toFixed(1));

  // Find candidate translators with enough remaining capacity
  const candidateTranslators = translators.filter(
    (t) => t.status !== 'OFFLINE' && t.status !== 'ON_LEAVE'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedTr = translators.find((t) => t.id === translatorId);
    if (selectedTr && !selectedTr.languages.includes(selectedLangRule.languageCode)) {
      alert(`Tidak dapat menetapkan: Penerjemah ${selectedTr.name} tidak menguasai pasangan bahasa ${selectedLangRule.languageCode}.`);
      return;
    }
    const deadlineAt = new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();

    createAssignment({
      title,
      clientName: clientName || 'Klien Umum',
      documentType,
      pageCount,
      languageFrom: selectedLangRule.languageCode,
      languageTo: 'Indonesia',
      pointMultiplier: selectedLangRule.pointsPerPage,
      calculatedPoints,
      translatorId: translatorId || undefined,
      translatorName: selectedTr?.name || undefined,
      priority,
      sourceFileName: sourceFileName || `${title.replace(/\s+/g, '_')}.pdf`,
      deadlineAt,
    });

    // Reset & close
    setTitle('');
    setClientName('');
    setPageCount(10);
    setSourceFileName('');
    setIsNewAssignmentModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Buat Penugasan Baru</h2>
              <p className="text-xs text-slate-400">Tambahkan detail dokumen & tetapkan ke penerjemah yang tersedia</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewAssignmentModalOpen(false)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
            {/* Title */}
            <div className="md:col-span-2 space-y-1">
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

            {/* Document Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Tipe Dokumen</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
              >
                <option value="Legal">Kontrak Hukum / NDA</option>
                <option value="Financial">Audit / Laporan Keuangan</option>
                <option value="Medical">Alat / Protokol Medis</option>
                <option value="Marketing">Pemasaran / Panduan Merek</option>
                <option value="Technical">Spesifikasi Teknis / Paten</option>
                <option value="Academic">Karya Ilmiah / Penelitian</option>
                <option value="General">Dokumen Umum</option>
              </select>
            </div>

            {/* Language Pair */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Pasangan Bahasa & Pengali</label>
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
                    {rule.languageName} (pengali {rule.pointsPerPage}x)
                  </option>
                ))}
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

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Tingkat Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
              >
                <option value="LOW">RENDAH</option>
                <option value="MEDIUM">SEDANG</option>
                <option value="HIGH">TINGGI</option>
                <option value="URGENT">DARURAT</option>
              </select>
            </div>

            {/* Deadline Hours */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Tenggat Waktu (Jam dari sekarang)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(parseInt(e.target.value) || 24)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-850 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Workload Points Calculation Highlight */}
          <div className="rounded-lg bg-pink-55 border border-pink-100 p-3.5 flex items-center justify-between text-pink-700 bg-pink-50/70">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-xs font-bold text-pink-600">Poin Beban Kerja Terkalkulasi Otomatis</p>
                <p className="text-[11px] text-pink-500/80">
                  {pageCount} halaman × pengali {selectedLangRule.pointsPerPage}x
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-pink-600 font-mono">
              {calculatedPoints} pt
            </span>
          </div>

          {/* Assign Translator Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Tetapkan Penerjemah (Opsional)
            </label>
            <select
              value={translatorId}
              onChange={(e) => setTranslatorId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-750 focus:outline-none focus:border-pink-500 transition-colors"
            >
              <option value="">Biarkan Tanpa Penerjemah (Pool)</option>
              {candidateTranslators.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status === 'READY' ? 'Siap Kerja' : t.status === 'WORKING' ? 'Sedang Bekerja' : t.status === 'PAUSED' ? 'Ditangguhkan' : t.status}) — Sisa Kapasitas: {t.remainingCapacityPoints} pt ({t.utilizationPercentage}% terisi)
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              Buat Penugasan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
