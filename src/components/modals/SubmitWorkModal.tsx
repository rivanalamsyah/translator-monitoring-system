import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UploadCloud, FileCheck, CheckCircle2 } from 'lucide-react';

export const SubmitWorkModal: React.FC = () => {
  const { activeSubmitAssignment, setActiveSubmitAssignment, submitAssignment } = useApp();

  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!activeSubmitAssignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    setTimeout(() => {
      const finalFileName =
        fileName || `${activeSubmitAssignment.code}_Translated_ID_${Date.now().toString().slice(-4)}.docx`;
      submitAssignment(activeSubmitAssignment.id, finalFileName, notes);
      setIsUploading(false);
      setActiveSubmitAssignment(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Kirim Hasil Terjemahan Selesai</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
          {/* File Upload Simulation Box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-pink-500 rounded-xl bg-slate-50 p-6 text-center transition-colors cursor-pointer">
            <UploadCloud className="h-10 w-10 text-pink-500 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-800">Seret & lepas berkas terjemahan di sini</p>
            <p className="text-[10px] text-slate-400 mt-1">Mendukung DOCX, PDF, XLSX, TXT (Maks 50MB)</p>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileName(e.target.files[0].name);
                }
              }}
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="mt-3 inline-block rounded-lg bg-pink-600 text-white px-4 py-1.5 text-xs font-semibold shadow-md shadow-pink-600/10 hover:bg-pink-700 transition-colors cursor-pointer"
            >
              Pilih Berkas Lokal
            </label>
          </div>

          {/* Selected File Indicator */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655">Nama Berkas yang Dikirim:</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <FileCheck className="h-4 w-4 text-pink-500" />
              <input
                type="text"
                placeholder="Nama_Berkas_Terjemahan.docx"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submission Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655">Catatan untuk Super Admin (Opsional):</label>
            <textarea
              rows={3}
              placeholder="Sebutkan catatan terminologi khusus, pemeriksaan silang, atau keputusan pemformatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveSubmitAssignment(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-purple-600/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <span>Mengunduh...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kirim Pekerjaan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
