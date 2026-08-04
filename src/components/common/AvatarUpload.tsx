/**
 * AvatarUpload — Komponen Upload Foto Profil Penerjemah
 *
 * Mendukung dua mode:
 * - localStorage mode (USE_FIREBASE=false): konversi ke Data URL, simpan di state lokal
 * - Firebase mode (USE_FIREBASE=true): upload ke Firebase Storage, simpan URL di Firestore
 */
import React, { useRef, useState } from 'react';
import { Upload, X, Camera, Loader } from 'lucide-react';
import { AvatarImage } from './AvatarImage';
import { USE_FIREBASE } from '../../lib/firebaseFlag';

/** Konversi File ke Data URL (untuk mode localStorage) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface AvatarUploadProps {
  /** Avatar URL saat ini */
  currentAvatar?: string;
  /** Nama penerjemah (untuk fallback) */
  name?: string;
  /** ID penerjemah (untuk path Firebase Storage) */
  translatorId?: string;
  /** Callback dipanggil setelah upload sukses dengan URL baru */
  onUploadComplete: (newAvatarUrl: string) => void;
  /** Kelas CSS untuk wrapper */
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  name,
  translatorId,
  onUploadComplete,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Update preview jika prop berubah dari luar
  React.useEffect(() => {
    setPreview(currentAvatar);
  }, [currentAvatar]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: hanya gambar, max 5MB
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diizinkan (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let newUrl: string;

      if (USE_FIREBASE && translatorId) {
        // Mode Firebase: upload ke Storage
        const { uploadAvatar } = await import('../../services/storageService');
        newUrl = await uploadAvatar(file, translatorId, (p) => setUploadProgress(p));
      } else {
        // Mode localStorage: konversi ke Data URL
        newUrl = await fileToDataUrl(file);
        setUploadProgress(100);
      }

      setPreview(newUrl);
      onUploadComplete(newUrl);
    } catch (err) {
      console.error('[AvatarUpload] Error:', err);
      setError('Gagal mengupload foto. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onUploadComplete('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Avatar Preview */}
      <div className="relative group">
        <AvatarImage
          src={preview}
          name={name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-pink-100 border-2 border-pink-200"
        />

        {/* Overlay kamera saat hover */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Ganti foto profil"
        >
          {isUploading ? (
            <Loader className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="w-full max-w-[200px] space-y-1">
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-400 font-mono">
            Mengupload... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-rose-600 font-medium text-center">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Pilih Foto</span>
        </button>

        {preview && (
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        Format: JPG, PNG, WebP • Maks. 5MB
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
