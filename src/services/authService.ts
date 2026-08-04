/**
 * Auth Service — Firebase Authentication
 *
 * Digunakan oleh AppContext saat USE_FIREBASE=true.
 * Menyediakan login/logout dengan Firebase Auth (Email/Password).
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

/**
 * Login dengan email & password via Firebase Auth.
 * Setelah login, ambil profil user dari Firestore koleksi `users`.
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Cari di koleksi users
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    // Fallback: cari di translator_profiles berdasarkan email
    const profilesRef = collection(db, 'translator_profiles');
    const q = query(profilesRef, where('email', '==', email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        name: data.name,
        email: data.email,
        role: 'TRANSLATOR' as UserRole,
        avatar: data.avatarUrl || '',
        phone: data.phone || '',
      };
    }
    return null;
  }

  const data = userSnap.data();
  return {
    id: uid,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    avatar: data.avatarUrl || '',
    phone: data.phone || '',
  };
}

/**
 * Logout dari Firebase Auth.
 */
export async function logoutFromFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

/**
 * Listener perubahan auth state.
 * Dipanggil sekali di AppProvider untuk sinkronisasi session.
 */
export function onFirebaseAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
