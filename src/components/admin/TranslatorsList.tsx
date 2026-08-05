import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Trash2,
  Languages,
  Phone,
  Mail,
  PieChart,
  Star,
  Search,
  Edit3,
  X,
  Save,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { AvatarImage } from '../common/AvatarImage';
import { TranslatorProfile } from '../../types';

export const TranslatorsList: React.FC = () => {
  const { translators, deleteTranslator, setIsNewTranslatorModalOpen, updateTranslator, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeEditTranslator, setActiveEditTranslator] = useState<TranslatorProfile | null>(null);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMaxCapacity, setEditMaxCapacity] = useState(20);
  const [editRating, setEditRating] = useState(5.0);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editCertifications, setEditCertifications] = useState('');
  const [editPaymentAccount, setEditPaymentAccount] = useState('');
  const [editSupportingDocs, setEditSupportingDocs] = useState('');
  const [editAvailability, setEditAvailability] = useState('');
  const [editStatus, setEditStatus] = useState<any>('READY');

  const filteredTranslators = useMemo(() => {
    return translators.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.languages.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [translators, searchQuery]);

  const handleStartEdit = (tr: TranslatorProfile) => {
    setActiveEditTranslator(tr);
    setEditName(tr.name);
    setEditEmail(tr.email);
    setEditPhone(tr.phone);
    setEditAddress(tr.address || '');
    setEditMaxCapacity(tr.maxCapacityPoints);
    setEditRating(tr.rating);
    setEditLanguages(tr.languages || []);
    setEditSpecialties(tr.specialties?.join(', ') || '');
    setEditCertifications(tr.certifications?.join(', ') || '');
    setEditPaymentAccount(tr.paymentAccount || '');
    setEditSupportingDocs(tr.supportingDocuments?.join(', ') || '');
    setEditAvailability(tr.availability || '');
    setEditStatus(tr.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTranslator) return;
    updateTranslator(
      activeEditTranslator.id,
      {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        maxCapacityPoints: editMaxCapacity,
        rating: editRating,
        languages: editLanguages,
        specialties: editSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: editCertifications.split(',').map((c) => c.trim()).filter(Boolean),
        paymentAccount: editPaymentAccount.trim(),
        supportingDocuments: editSupportingDocs.split(',').map((d) => d.trim()).filter(Boolean),
        availability: editAvailability.trim(),
        status: editStatus,
      },
      activeEditTranslator.version
    );
    setActiveEditTranslator(null);
  };

  const toggleLanguage = (code: string) => {
    setEditLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            <span>Direktori Penerjemah & Kapasitas Beban Kerja</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola penerjemah aktif, kompetensi bahasa, batas kapasitas, dan skor kinerja
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari penerjemah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsNewTranslatorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Daftarkan Penerjemah</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTranslators.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
          Penerjemah tidak ditemukan berdasarkan pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTranslators.map((tr) => (
            <div
              key={tr.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-pink-500/40 transition-all space-y-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarImage
                    src={tr.avatar}
                    name={tr.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{tr.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{tr.rating}</span>
                      <span className="text-slate-400">({tr.completedJobsCount} selesai)</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={tr.status} size="sm" />
              </div>

              {/* Contact details */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{tr.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{tr.phone}</span>
                </div>
                {tr.address && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{tr.address}</span>
                  </div>
                )}
              </div>

              {/* Specialties & Certifications if exist */}
              {(tr.specialties?.length || tr.certifications?.length) ? (
                <div className="space-y-1 text-[11px]">
                  {tr.specialties && tr.specialties.length > 0 && (
                    <p className="text-slate-500">
                      <span className="font-bold text-slate-400">Spesialisasi:</span> {tr.specialties.join(', ')}
                    </p>
                  )}
                  {tr.certifications && tr.certifications.length > 0 && (
                    <p className="text-slate-500">
                      <span className="font-bold text-slate-400">Sertifikasi:</span> {tr.certifications.join(', ')}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Languages */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Languages className="h-3 w-3 text-pink-500" />
                  Bahasa yang Dikuasai
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tr.languages.map((l) => (
                    <span
                      key={l}
                      className="rounded bg-pink-50 text-pink-600 border border-pink-100/50 px-2 py-0.5 text-xs font-semibold"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload Progress */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <PieChart className="h-3.5 w-3.5 text-pink-500" />
                    Beban Kerja
                  </span>
                  <span className="text-slate-800 font-mono">
                    {tr.currentLoadPoints} / {tr.maxCapacityPoints} pt
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tr.utilizationPercentage > 80
                        ? 'bg-rose-500'
                        : tr.utilizationPercentage > 50
                        ? 'bg-amber-500'
                        : 'bg-pink-500'
                    }`}
                    style={{ width: `${tr.utilizationPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Tersisa: {tr.remainingCapacityPoints} pt</span>
                  <span>{tr.utilizationPercentage}% Terisi</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleStartEdit(tr)}
                  className="rounded-lg p-2 text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                  title="Edit Profil Penerjemah"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTranslator(tr.id)}
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus Penerjemah"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Translator Modal */}
      {activeEditTranslator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white shadow-md shadow-pink-600/10">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Edit Profil Penerjemah</h2>
                  <p className="text-xs text-slate-400">
                    Modifikasi informasi, rating, kualifikasi, & kapasitas ketersediaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveEditTranslator(null)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">WhatsApp / Telepon *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Alamat Rumah</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Poin Kapasitas Beban Kerja Maksimal</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={editMaxCapacity}
                    onChange={(e) => setEditMaxCapacity(parseInt(e.target.value) || 20)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Skor Penilaian / Rating (0 - 5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.05"
                    value={editRating}
                    onChange={(e) => setEditRating(parseFloat(e.target.value) || 5.0)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-slate-700">
                <label className="text-xs font-semibold text-slate-600">Bahasa yang Dikuasai</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {settings.languageRules.map((rule) => {
                    const isSelected = editLanguages.includes(rule.languageCode);
                    return (
                      <button
                        key={rule.languageCode}
                        type="button"
                        onClick={() => toggleLanguage(rule.languageCode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rule.languageCode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Spesialisasi (Koma)</label>
                  <input
                    type="text"
                    value={editSpecialties}
                    onChange={(e) => setEditSpecialties(e.target.value)}
                    placeholder="Legal, Medis, Teknik"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Sertifikasi (Koma)</label>
                  <input
                    type="text"
                    value={editCertifications}
                    onChange={(e) => setEditCertifications(e.target.value)}
                    placeholder="HPI Certified, ATA Member"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-slate-700">
                <label className="text-xs font-semibold text-slate-600">Rekening Pembayaran</label>
                <input
                  type="text"
                  value={editPaymentAccount}
                  onChange={(e) => setEditPaymentAccount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1 text-slate-700">
                <label className="text-xs font-semibold text-slate-600">Dokumen Pendukung / Portofolio (Koma)</label>
                <input
                  type="text"
                  value={editSupportingDocs}
                  onChange={(e) => setEditSupportingDocs(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Jadwal Ketersediaan</label>
                  <input
                    type="text"
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value)}
                    placeholder="Senin - Jumat 09:00 - 18:00"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1 text-slate-700">
                  <label className="text-xs font-semibold text-slate-600">Status Ketersediaan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:outline-none focus:border-pink-500"
                  >
                    <option value="READY">Ready</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="WORKING">Working</option>
                    <option value="PAUSED">Paused</option>
                    <option value="REVISION">Revision</option>
                    <option value="WAITING_REVIEW">Waiting Review</option>
                  </select>
                </div>
              </div>

              {activeEditTranslator.updatedAt && (
                <div className="text-[10px] text-slate-400 font-mono pt-2">
                  Terakhir Diupdate: {new Date(activeEditTranslator.updatedAt).toLocaleString()} | Versi: {activeEditTranslator.version || 1}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveEditTranslator(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-pink-600/10 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
