/**
 * Storage Service — Firebase Storage untuk Avatar Penerjemah
 *
 * Digunakan saat USE_FIREBASE=true.
 * Upload foto profil ke Firebase Storage dan return URL-nya.
 */
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from '../lib/firebase';

/**
 * Upload avatar ke Firebase Storage.
 * Path: avatars/{translatorId}/{timestamp}_{filename}
 *
 * @param file - File gambar yang akan diupload
 * @param translatorId - ID penerjemah
 * @param onProgress - Callback progress upload (0-100)
 * @returns Download URL dari avatar yang berhasil diupload
 */
export async function uploadAvatar(
  file: File,
  translatorId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}_avatar.${ext}`;
    const storageRef = ref(storage, `avatars/${translatorId}/${filename}`);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      task.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.warn('[TMS Storage] Firebase Storage error, falling back to base64:', error);
          fileToDataUrl(file).then(resolve).catch(reject);
        },
        async () => {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  } catch (err) {
    console.warn('[TMS Storage] Firebase Storage not initialized, falling back to base64:', err);
    return fileToDataUrl(file);
  }
}

/**
 * Hapus avatar lama dari Firebase Storage.
 * @param avatarUrl - URL avatar yang akan dihapus
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, avatarUrl);
    await deleteObject(storageRef);
  } catch (err) {
    // Abaikan error jika file tidak ditemukan
    console.warn('[TMS Storage] Could not delete old avatar:', err);
  }
}

/**
 * Mode localStorage: Konversi File ke Data URL untuk preview dan penyimpanan lokal.
 * Digunakan saat USE_FIREBASE=false.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
