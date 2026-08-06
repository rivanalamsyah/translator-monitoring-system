import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Link2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SubmitWorkModal: React.FC = () => {
  const { activeSubmitAssignment, setActiveSubmitAssignment, submitAssignment } = useApp();

  const [driveUrl, setDriveUrl] = useState(activeSubmitAssignment?.resultFileUrl || '');
  const [isAccessConfirmed, setIsAccessConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  if (!activeSubmitAssignment) return null;

  const validateUrl = (url: string): boolean => {
    const gdriveRegex = /^(https?:\/\/)?((drive|docs|sheets|slides|forms)\.google\.com)\/[a-zA-Z0-9_\-\.\/\?&=\+]+/i;
    return gdriveRegex.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!driveUrl.trim()) {
      setErrorMsg('Tautan Google Drive tidak boleh kosong.');
      return;
    }

    if (!validateUrl(driveUrl.trim())) {
      setErrorMsg('Format tautan tidak valid. Pastikan Anda memasukkan URL Google Drive, Docs, Sheets, atau Slides yang benar (contoh: https://drive.google.com/file/d/...).');
      return;
    }

    if (!isAccessConfirmed) {
      setErrorMsg('Anda harus mencentang kotak konfirmasi izin akses link.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitAssignment(activeSubmitAssignment.id, driveUrl.trim(), notes);
      setIsSubmitting(false);
      setActiveSubmitAssignment(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Kirim Hasil Pekerjaan</h2>
              <p className="text-xs text-slate-400">
                {activeSubmitAssignment.code} — {activeSubmitAssignment.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubmitAssignment(null)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700">
            {errorMsg && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Drive Link Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Tautan (URL) Google Drive Dokumen Terjemahan *</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500/50 transition-colors">
                <Link2 className="h-4 w-4 text-pink-500" />
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox for Permission */}
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <input
                type="checkbox"
                id="confirm-permission-checkbox"
                checked={isAccessConfirmed}
                onChange={(e) => setIsAccessConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-350 text-pink-600 focus:ring-pink-500 cursor-pointer"
              />
              <label htmlFor="confirm-permission-checkbox" className="text-[11px] text-slate-655 leading-tight cursor-pointer">
                <strong>Konfirmasi Akses:</strong> Saya telah mengatur status berbagi link Google Drive ini menjadi <strong>"Anyone with the link can view"</strong> (Siapa saja yang memiliki link dapat melihat) agar Super Admin dapat melakukan audit/review dokumen tanpa hambatan.
              </label>
            </div>

            {/* Submission Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Catatan Tambahan untuk Admin (Opsional):</label>
              <textarea
                rows={3}
                placeholder="Catatan mengenai pemformatan, terminologi, atau keputusan penerjemahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveSubmitAssignment(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Mengirim...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kirim Hasil Pekerjaan</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
