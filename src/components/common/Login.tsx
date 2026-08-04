import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { USE_FIREBASE } from '../../lib/firebaseFlag';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Silakan isi semua kolom.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulasi delay jaringan untuk UX
      await new Promise((r) => setTimeout(r, 800));
      const success = await Promise.resolve(login(email, password));
      if (!success) {
        setError('Email atau kata sandi tidak valid.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img src={logoImg} className="h-16 w-auto object-contain" alt="Logo" />
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Sistem Monitoring Penerjemah
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              by Master Translate
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@translator.id"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-600/20 disabled:bg-pink-400 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5 justify-center py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
              </span>
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info (only show demo credentials when not using Firebase) */}
        {!USE_FIREBASE && (
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Kredensial Demo
            </p>
            <div className="text-[10px] text-slate-600 font-mono space-y-1 text-left bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <div>🔑 Admin: <span className="text-pink-600 font-semibold">admin@translator.id</span></div>
              <div>🔑 Penerjemah: <span className="text-pink-600 font-semibold">ahmad.rizky@translator.id</span></div>
              <div className="text-[9px] text-slate-400 mt-2 text-center border-t border-slate-200/60 pt-1.5">Kata sandi untuk semua akun: "password"</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
