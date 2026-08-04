/**
 * TranslatorProfileView — Halaman Profil & Kapasitas Penerjemah
 *
 * Fitur:
 * - Kartu profil lengkap dengan upload foto
 * - Kapasitas gauge visual
 * - Form edit data kontak
 * - Statistik ringkas dan riwayat 5 pekerjaan terakhir
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Mail,
  Phone,
  Languages,
  Star,
  CheckCircle2,
  TrendingUp,
  Shield,
  FileText,
  Edit3,
  Save,
  X,
  Award,
  Clock,
} from 'lucide-react';
import { AvatarUpload } from '../common/AvatarUpload';
import { StatusBadge } from '../common/Badge';
import { formatDuration } from '../../utils/formatters';

export const TranslatorProfileView: React.FC = () => {
  const { currentTranslatorProfile, assignments, updateTranslator, settings } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(currentTranslatorProfile?.phone || '');
  const [editName, setEditName] = useState(currentTranslatorProfile?.name || '');

  if (!currentTranslatorProfile) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium">
        Memuat profil penerjemah...
      </div>
    );
  }

  const myAssignments = assignments.filter(
    (a) => a.translatorId === currentTranslatorProfile.id
  );
  const completedAssignments = myAssignments
    .filter((a) => a.status === 'COMPLETED')
    .slice()
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
    .slice(0, 5);

  const totalWorkSeconds = myAssignments.reduce(
    (acc, a) => acc + a.totalWorkingSeconds,
    0
  );
  const totalPages = myAssignments
    .filter((a) => a.status === 'COMPLETED')
    .reduce((acc, a) => acc + a.pageCount, 0);

  const utilisasi = currentTranslatorProfile.utilizationPercentage;
  const utilisasiColor =
    utilisasi > 80
      ? 'bg-rose-500'
      : utilisasi > 50
        ? 'bg-amber-500'
        : 'bg-pink-500';

  const handleSaveEdit = () => {
    updateTranslator(currentTranslatorProfile.id, {
      name: editName.trim() || currentTranslatorProfile.name,
      phone: editPhone.trim() || currentTranslatorProfile.phone,
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (newAvatarUrl: string) => {
    updateTranslator(currentTranslatorProfile.id, { avatar: newAvatarUrl });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-700 to-rose-600 text-white rounded-2xl p-6 shadow-md border border-pink-700/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-pink-100 uppercase tracking-widest">
            Profil & Kapasitas Penerjemah
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Kelola Identitas & Beban Kerja Anda</h2>
        <p className="text-xs text-pink-100/80 mt-1">
          Perbarui data kontak, unggah foto profil, dan pantau kapasitas terjemahan Anda secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Card */}
        <div className="space-y-4">
          {/* Avatar & Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-pink-600" />
                <span>Foto Profil</span>
              </h3>
              <StatusBadge status={currentTranslatorProfile.status} size="sm" />
            </div>

            {/* Avatar Upload */}
            <AvatarUpload
              currentAvatar={currentTranslatorProfile.avatar}
              name={currentTranslatorProfile.name}
              translatorId={currentTranslatorProfile.id}
              onUploadComplete={handleAvatarUpload}
            />
          </div>

          {/* Workload Capacity Gauge */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-pink-600" />
              <span>Kapasitas Beban Kerja</span>
            </h3>

            {/* Visual Gauge */}
            <div className="text-center space-y-3">
              {/* Circular-style gauge with CSS */}
              <div className="relative mx-auto w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={utilisasi > 80 ? '#f43f5e' : utilisasi > 50 ? '#f59e0b' : '#ec4899'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${utilisasi * 2.513} 251.3`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 font-mono">{utilisasi}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">Utilisasi</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="font-black text-pink-600 font-mono">{currentTranslatorProfile.currentLoadPoints}</p>
                  <p className="text-[10px] text-slate-400">Terisi (pt)</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="font-black text-emerald-600 font-mono">{currentTranslatorProfile.remainingCapacityPoints}</p>
                  <p className="text-[10px] text-slate-400">Tersisa (pt)</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="font-black text-slate-800 font-mono">{currentTranslatorProfile.maxCapacityPoints}</p>
                  <p className="text-[10px] text-slate-400">Maksimal (pt)</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${utilisasiColor}`}
                    style={{ width: `${utilisasi}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono text-center">
                  {currentTranslatorProfile.currentLoadPoints} / {currentTranslatorProfile.maxCapacityPoints} poin terpakai
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Info & Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Data Profil */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-pink-600" />
                <span>Data Profil Penerjemah</span>
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setEditName(currentTranslatorProfile.name);
                    setEditPhone(currentTranslatorProfile.phone);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Batal</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" /> Nama Lengkap
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-pink-300 bg-pink-50/30 px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-800 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                    {currentTranslatorProfile.name}
                  </p>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Akun
                </label>
                <p className="text-sm text-slate-500 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 truncate">
                  {currentTranslatorProfile.email}
                </p>
              </div>

              {/* Telepon */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Nomor Telepon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-lg border border-pink-300 bg-pink-50/30 px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                    {currentTranslatorProfile.phone}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Skor Penilaian
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" />
                  <span className="text-sm font-black text-amber-700 font-mono">
                    {currentTranslatorProfile.rating} / 5.0
                  </span>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Languages className="h-3 w-3" /> Bahasa yang Dikuasai
              </label>
              <div className="flex flex-wrap gap-2">
                {currentTranslatorProfile.languages.map((lang) => {
                  const rule = settings.languageRules.find((r) => r.languageCode === lang);
                  return (
                    <div
                      key={lang}
                      className="rounded-lg bg-pink-50 border border-pink-100 px-3 py-1.5 text-xs flex items-center gap-2"
                    >
                      <span className="font-bold text-pink-700">{lang}</span>
                      {rule && (
                        <span className="text-[10px] text-pink-500 font-mono">
                          {rule.pointsPerPage} pt/hlm
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Statistik Ringkas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-center space-y-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
              <p className="text-xl font-black text-slate-800 font-mono">
                {currentTranslatorProfile.completedJobsCount}
              </p>
              <p className="text-[10px] text-slate-400">Tugas Selesai</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-center space-y-1">
              <FileText className="h-5 w-5 text-pink-500 mx-auto" />
              <p className="text-xl font-black text-slate-800 font-mono">{totalPages}</p>
              <p className="text-[10px] text-slate-400">Halaman Diterjemahkan</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-center space-y-1">
              <Clock className="h-5 w-5 text-amber-500 mx-auto" />
              <p className="text-xl font-black text-slate-800 font-mono">
                {Math.round(totalWorkSeconds / 3600)}j
              </p>
              <p className="text-[10px] text-slate-400">Total Jam Kerja</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-center space-y-1">
              <Award className="h-5 w-5 text-purple-500 mx-auto" />
              <p className="text-xl font-black text-slate-800 font-mono">
                {myAssignments.filter((a) => a.status === 'COMPLETED').reduce((acc, a) => acc + a.calculatedPoints, 0)} pt
              </p>
              <p className="text-[10px] text-slate-400">Total Poin Selesai</p>
            </div>
          </div>

          {/* Riwayat 5 Pekerjaan Terakhir */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield className="h-4 w-4 text-pink-600" />
                <span>5 Pekerjaan Terakhir Diselesaikan</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{completedAssignments.length} dokumen</span>
            </div>

            {completedAssignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada pekerjaan yang diselesaikan.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {completedAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="text-pink-600">{a.code}</span>
                        <span>•</span>
                        <span>{a.languageFrom}</span>
                        <span>•</span>
                        <span>{a.pageCount} hlm</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <p className="text-xs font-black text-emerald-600 font-mono">
                        {a.calculatedPoints} pt
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDuration(a.totalWorkingSeconds)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
