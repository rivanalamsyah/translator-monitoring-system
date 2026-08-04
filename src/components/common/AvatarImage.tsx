/**
 * AvatarImage — Komponen Avatar dengan Fallback Lokal
 *
 * Menggantikan semua <img src={tr.avatar}> di seluruh sistem.
 * Secara otomatis fallback ke avatar_male.png atau avatar_female.png
 * jika URL gambar tidak valid, kosong, atau gagal dimuat.
 */
import React, { useState } from 'react';
import avatarMale from '../../assets/avatar_male.png';
import avatarFemale from '../../assets/avatar_female.png';

interface AvatarImageProps {
  /** URL atau path gambar avatar */
  src?: string;
  /** Nama penerjemah (untuk alt text dan initial fallback) */
  name?: string;
  /** Gender untuk memilih avatar fallback yang tepat */
  gender?: 'male' | 'female' | 'auto';
  /** Kelas CSS tambahan */
  className?: string;
  /** Ukuran dalam pixel (square), jika menggunakan initial fallback */
  size?: number;
}

/**
 * Tentukan avatar fallback berdasarkan gender atau nama.
 * Nama yang berakhiran 'a' atau 'i' (umum nama perempuan Indonesia)
 * akan dideteksi sebagai female.
 */
function getFallbackAvatar(name?: string, gender?: 'male' | 'female' | 'auto'): string {
  if (gender === 'female') return avatarFemale;
  if (gender === 'male') return avatarMale;

  // Auto-detect dari nama
  if (name) {
    const firstName = name.trim().split(' ')[0].toLowerCase();
    // Nama perempuan umum Indonesia / nama asing perempuan
    const femaleNames = ['siti', 'dewi', 'elena', 'putri', 'nurul', 'rani', 'ana', 'sri', 
                         'maya', 'dina', 'lisa', 'nadia', 'tari', 'yuni', 'wati'];
    const femaleEnding = firstName.endsWith('a') || firstName.endsWith('i');
    if (femaleNames.includes(firstName) || femaleEnding) {
      return avatarFemale;
    }
  }
  return avatarMale;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  name,
  gender = 'auto',
  className = 'h-10 w-10 rounded-full object-cover',
  size,
}) => {
  const fallback = getFallbackAvatar(name, gender as 'male' | 'female' | 'auto');
  const [imgSrc, setImgSrc] = useState<string>(src || fallback);

  // Sinkronisasi jika prop src berubah
  React.useEffect(() => {
    setImgSrc(src || fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleError = () => {
    setImgSrc(fallback);
  };

  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={imgSrc}
      alt={name || 'Avatar'}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
};
