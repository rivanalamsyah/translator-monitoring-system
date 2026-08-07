// @ts-ignore: React types are not installed in this environment
import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function Login() {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();

      if (loading) return;

      const normalizedEmail = email.trim();

      if (!normalizedEmail || !password) {
        setError('Silakan isi email dan kata sandi.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const success = await login(normalizedEmail, password);

        if (!success) {
          setError('Email atau kata sandi tidak valid.');
        }
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Terjadi kesalahan. Silakan coba lagi.');
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading, login]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl space-y-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src={logoImg}
            alt="Logo Master Translate"
            className="h-16 w-auto object-contain"
          />

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Sistem Monitoring Penerjemah
            </h1>

            <p className="mt-1 text-xs font-medium text-slate-500">
              by Master Translate
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Alamat Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                disabled={loading}
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              Kata Sandi
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                maxLength={128}
                disabled={loading}
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-600/20 transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-400"
          >
            {loading ? (
              <span className="flex items-center gap-1.5 py-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
              </span>
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}