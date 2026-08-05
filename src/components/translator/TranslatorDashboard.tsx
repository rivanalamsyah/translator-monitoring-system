import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Play,
  Pause,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Link2,
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatClock, formatDuration, formatDate } from '../../utils/formatters';

export const TranslatorDashboard: React.FC = () => {
  const {
    currentTranslatorProfile,
    assignments,
    startAssignmentTimer,
    resumeAssignmentTimer,
    setActivePauseAssignment,
    setActiveSubmitAssignment,
    submitAssignment,
    timerLogs,
  } = useApp();

  const [driveUrl, setDriveUrl] = useState('');
  const [isAccessConfirmed, setIsAccessConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentTranslatorProfile) {
    return <div className="p-8 text-center text-slate-400 font-medium">Memuat ruang kerja penerjemah...</div>;
  }

  // Find assignments strictly belonging to this active translator
  const myAssignments = assignments.filter((a) => a.translatorId === currentTranslatorProfile.id);

  // Active Job (Working, Paused, or Revision)
  const activeJob = myAssignments.find(
    (a) => a.status === 'WORKING' || a.status === 'PAUSED' || a.status === 'REVISION' || a.status === 'ASSIGNED'
  );

  useEffect(() => {
    if (activeJob) {
      setDriveUrl(activeJob.resultFileUrl || '');
    } else {
      setDriveUrl('');
    }
    setErrorMsg('');
    setIsAccessConfirmed(false);
  }, [activeJob?.id, activeJob?.resultFileUrl]);

  const handleDriveSubmit = () => {
    setErrorMsg('');
    if (!activeJob) return;

    if (!driveUrl.trim()) {
      setErrorMsg('Tautan Google Drive tidak boleh kosong.');
      return;
    }

    // Validate link
    const gdriveRegex = /^(https?:\/\/)?((drive|docs|sheets|slides|forms)\.google\.com)\/[a-zA-Z0-9_\-\.\/\?&=\+]+/i;
    if (!gdriveRegex.test(driveUrl.trim())) {
      setErrorMsg('Format tautan tidak valid. Gunakan URL Google Drive yang benar (contoh: https://drive.google.com/file/d/...).');
      return;
    }

    if (!isAccessConfirmed) {
      setErrorMsg('Anda harus mencentang kotak konfirmasi izin akses link.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitAssignment(activeJob.id, driveUrl.trim(), 'Hasil dikirim langsung dari halaman detail tugas.');
      setIsSubmitting(false);
    }, 600);
  };

  const completedCount = myAssignments.filter((a) => a.status === 'COMPLETED').length;
  const revisionCount = myAssignments.filter((a) => a.status === 'REVISION').length;

  const now = new Date();
  const dueTodayCount = myAssignments.filter((a) => {
    if (a.status === 'COMPLETED') return false;
    const d = new Date(a.deadlineAt);
    return d.toDateString() === now.toDateString();
  }).length;

  // Filter timer logs for active job
  const jobTimerLogs = activeJob ? timerLogs.filter((tl) => tl.assignmentId === activeJob.id) : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-600 via-pink-700 to-rose-600 text-white rounded-xl p-6 shadow-md border border-pink-700/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-pink-100 uppercase tracking-widest">Ruang Kerja Penerjemah</span>
          </div>
          <h2 className="text-xl font-bold text-white">Selamat datang kembali, {currentTranslatorProfile.name}!</h2>
          <p className="text-xs text-pink-100/90">
            Bahasa: <span className="font-bold text-white">{currentTranslatorProfile.languages.join(', ')}</span> • Kapasitas Saat Ini:{' '}
            <span className="font-bold text-white font-mono">{currentTranslatorProfile.currentLoadPoints} / {currentTranslatorProfile.maxCapacityPoints} pt</span>
          </p>
        </div>

        <StatusBadge status={currentTranslatorProfile.status} size="lg" />
      </div>

      {/* 6 Personal Metric Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tugas Saya</p>
          <p className="text-lg font-black text-slate-800">{myAssignments.length}</p>
          <p className="text-[10px] text-slate-400">Ditugaskan ke Saya</p>
        </div>

        <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3 shadow-xs">
          <p className="text-[10px] font-bold text-pink-600 uppercase">Tugas Aktif</p>
          <p className="text-lg font-black text-pink-700">{activeJob ? 1 : 0}</p>
          <p className="text-[10px] text-pink-600/80">Sedang Berjalan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Batas Hari Ini</p>
          <p className="text-lg font-black text-slate-800">{dueTodayCount}</p>
          <p className="text-[10px] text-slate-400">Tenggat 24 Jam</p>
        </div>

        <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3 shadow-xs">
          <p className="text-[10px] font-bold text-pink-600 uppercase">Status Timer</p>
          <p className="text-lg font-black text-pink-700">
            {activeJob?.status === 'WORKING' ? 'BERJALAN' : activeJob?.status === 'PAUSED' ? 'DIJEDA' : 'NONAKTIF'}
          </p>
          <p className="text-[10px] text-pink-600/80">Telemetri Langsung</p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 shadow-xs">
          <p className="text-[10px] font-bold text-teal-600 uppercase">Selesai</p>
          <p className="text-lg font-black text-teal-700">{completedCount}</p>
          <p className="text-[10px] text-teal-600/80">Dokumen Disetujui</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-xs">
          <p className="text-[10px] font-bold text-rose-600 uppercase">Revisi</p>
          <p className="text-lg font-black text-rose-700">{revisionCount}</p>
          <p className="text-[10px] text-rose-600/80">Butuh Perbaikan</p>
        </div>
      </div>

      {/* Main Command Console: Active Job Controller */}
      {activeJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Active Job Details & Timer Engine */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-pink-600">
                      {activeJob.code}
                    </span>
                    <PriorityBadge priority={activeJob.priority} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{activeJob.title}</h3>
                  <p className="text-xs text-slate-400">Klien: {activeJob.clientName}</p>
                </div>

                <StatusBadge status={activeJob.status} size="md" />
              </div>

              {/* Revision Notice Alert if in Revision status */}
              {activeJob.status === 'REVISION' && activeJob.revisionNotes && (
                <div className="rounded-lg bg-rose-50 border border-rose-250 p-4 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>Catatan Permintaan Revisi Super Admin:</span>
                  </div>
                  <p className="text-slate-600 italic">"{activeJob.revisionNotes}"</p>
                </div>
              )}

              {/* Document Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Pasangan Bahasa</p>
                  <p className="font-bold text-slate-800">{activeJob.languageFrom}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Jumlah Halaman</p>
                  <p className="font-bold text-slate-800">{activeJob.pageCount} halaman</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Poin Beban Kerja</p>
                  <p className="font-bold text-pink-600 font-mono">{activeJob.calculatedPoints} pt</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Tenggat Waktu</p>
                  <p className="font-bold text-slate-800">{formatDate(activeJob.deadlineAt)}</p>
                </div>
              </div>

              {/* Download Source File */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">{activeJob.sourceFileName}</p>
                    <p className="text-[10px] text-slate-400">Berkas Sumber Dokumen</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Mengunduh berkas sumber... (Simulasi)')}
                  className="flex items-center gap-1 rounded bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-pink-600/10 cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Sumber</span>
                </button>
              </div>

              {/* Google Drive Link Submission Section */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 text-left">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Link2 className="h-4.5 w-4.5 text-pink-600" />
                  <span>Kirim Hasil Terjemahan (Tautan Google Drive)</span>
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-pink-500 transition-colors">
                    <Link2 className="h-4 w-4 text-pink-500" />
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/.../view"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  {errorMsg && <p className="text-[11px] text-rose-600 font-medium">{errorMsg}</p>}
                  
                  <div className="flex items-start gap-2 bg-white border border-slate-150 p-2.5 rounded-lg">
                    <input
                      type="checkbox"
                      id="confirm-dashboard-permission"
                      checked={isAccessConfirmed}
                      onChange={(e) => setIsAccessConfirmed(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-350 text-pink-600 focus:ring-pink-500 cursor-pointer"
                    />
                    <label htmlFor="confirm-dashboard-permission" className="text-[10px] text-slate-500 leading-normal cursor-pointer">
                      Saya mengonfirmasi bahwa link Google Drive ini diatur ke <strong>"Anyone with the link can view"</strong> (Siapa saja yang memiliki link dapat melihat) agar Admin dapat melakukan review.
                    </label>
                  </div>
                  
                  <button
                    onClick={handleDriveSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white py-2.5 text-xs font-bold transition-all shadow-md shadow-pink-600/10 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isSubmitting ? 'Mengirim...' : 'Kirim Hasil Terjemahan'}</span>
                  </button>
                </div>
              </div>

              {/* DIGITAL TIMER CONTROLLER */}
              <div className="rounded-xl bg-slate-50 text-slate-800 p-6 shadow-xs space-y-6 text-center border border-slate-200/80">
                <div className="space-y-1">
                  <p className="text-xs uppercase font-mono tracking-widest text-pink-600">
                    {activeJob.status === 'WORKING'
                      ? 'TIMER BERJALAN LANGSUNG (BEKERJA)'
                      : activeJob.status === 'PAUSED'
                      ? 'TIMER DIJEDA (PENCATATAN WAKTU DIAM)'
                      : 'SIAP MEMULAI PEKERJAAN'}
                  </p>
                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-pink-600">
                    {formatClock(activeJob.status === 'WORKING' ? activeJob.totalWorkingSeconds : activeJob.totalIdleSeconds)}
                  </div>
                  <div className="flex justify-center gap-6 text-xs text-slate-500 font-mono pt-2">
                    <span>Kerja: {formatDuration(activeJob.totalWorkingSeconds)}</span>
                    <span>Jeda: {formatDuration(activeJob.totalIdleSeconds)}</span>
                  </div>
                </div>

                {/* CONTROLLER ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* START BUTTON (if ASSIGNED or REVISION) */}
                  {(activeJob.status === 'ASSIGNED' || activeJob.status === 'REVISION') && (
                    <button
                      onClick={() => startAssignmentTimer(activeJob.id)}
                      className="flex items-center gap-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      <span>MULAI TIMER</span>
                    </button>
                  )}

                  {/* PAUSE BUTTON (if WORKING) */}
                  {activeJob.status === 'WORKING' && (
                    <button
                      onClick={() => setActivePauseAssignment(activeJob)}
                      className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Pause className="h-4 w-4" />
                      <span>JEDA TIMER</span>
                    </button>
                  )}

                  {/* RESUME BUTTON (if PAUSED) */}
                  {activeJob.status === 'PAUSED' && (
                    <button
                      onClick={() => resumeAssignmentTimer(activeJob.id)}
                      className="flex items-center gap-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      <span>LANJUTKAN TIMER</span>
                    </button>
                  )}

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={() => setActiveSubmitAssignment(activeJob)}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>KIRIM PEKERJAAN</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Timer Interval Logs */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-pink-600" />
                <span>Log Sesi Timer</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Telemetri Tugas</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Sesi Kerja Aktif</span>
                  <span className="text-pink-600 font-mono">Berjalan</span>
                </div>
                <p className="text-slate-400 text-[11px]">Memulai timer pada {formatDate(activeJob.startedAt)}</p>
              </div>

              {jobTimerLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1 text-xs"
                >
                  <div className="flex justify-between font-bold text-slate-700">
                    <span className={log.type === 'WORK' ? 'text-pink-600' : 'text-amber-600'}>
                      {log.type === 'WORK' ? 'Interval Kerja' : 'Interval Jeda'}
                    </span>
                    <span className="font-mono text-slate-400">{formatDate(log.startTime)}</span>
                  </div>
                  {log.reason && <p className="text-slate-500 italic text-[11px]">"{log.reason}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Tugas Aktif yang Berjalan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Saat ini Anda tidak memiliki pengukur waktu pengerjaan yang aktif. Super Admin akan menetapkan tugas dokumen baru berdasarkan kompetensi bahasa & kapasitas beban kerja Anda.
          </p>
        </div>
      )}
    </div>
  );
};
