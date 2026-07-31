import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Route } from '@/App';

interface AuthPageProps {
  onNavigate: (route: Route) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(error);
        setBusy(false);
      } else {
        onNavigate({ name: 'home' });
      }
    } else if (mode === 'signup') {
      const { error } = await signUp(email.trim(), password, fullName.trim() || undefined);
      if (error) {
        setError(error);
        setBusy(false);
      } else {
        setInfo('Welcome. Your account is ready — please sign in to continue.');
        setMode('signin');
        setBusy(false);
        setPassword('');
      }
    } else {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setError(error);
        setBusy(false);
      } else {
        setInfo('Check your inbox — we sent you a link to reset your password.');
        setBusy(false);
        setEmail('');
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden lg:block">
        <img
          src="https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Candlelit fine dining"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/20" />
        <div className="relative h-full flex flex-col justify-end p-16">
          <p className="eyebrow eyebrow-left mb-6">Lumière</p>
          <h2 className="heading-xl text-cream-50 text-shadow-lg max-w-md">
            An evening of<br />French elegance
          </h2>
          <p className="mt-6 text-cream-200/80 max-w-sm leading-relaxed">
            Sign in to manage your reservations, or create an account to join us
            at the table.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-20 lg:p-16 bg-ink-950">
        <div className="w-full max-w-md">
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className="text-xs uppercase tracking-widest2 text-ink-300 hover:text-gold-300 transition-colors mb-10"
          >
            ← Back to site
          </button>

          <div className="mb-10">
            <p className="eyebrow eyebrow-left mb-4">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Join us' : 'Reset password'}
            </p>
            <h1 className="heading-md text-cream-50">
              {mode === 'signin' ? 'Sign in to Lumière' : mode === 'signup' ? 'Create your account' : 'Recover your access'}
            </h1>
          </div>

          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 p-1 rounded-full bg-ink-800/80 border border-white/5 mb-8">
              <button
                onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                className={`flex-1 rounded-full py-2.5 text-sm uppercase tracking-widest2 transition-all ${
                  mode === 'signin' ? 'bg-gold-500 text-ink-950' : 'text-ink-300 hover:text-cream-100'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
                className={`flex-1 rounded-full py-2.5 text-sm uppercase tracking-widest2 transition-all ${
                  mode === 'signup' ? 'bg-gold-500 text-ink-950' : 'text-ink-300 hover:text-cream-100'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="label-field" htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="label-field" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="label-field" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-wine-500/15 border border-wine-500/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl bg-gold-500/10 border border-gold-500/30 px-4 py-3 text-sm text-gold-200">
                {info}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-gold w-full btn-gold-lg">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="mt-4 text-center">
              <button
                onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                className="text-sm text-gold-300/80 hover:text-gold-200 underline underline-offset-4 transition-colors"
              >
                Forgot your password?
              </button>
            </p>
          )}

          {mode === 'forgot' ? (
            <p className="mt-8 text-center text-sm text-ink-400">
              Remembered it?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                className="text-gold-300 hover:text-gold-200 underline underline-offset-4 transition-colors"
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <p className="mt-8 text-center text-sm text-ink-400">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
                className="text-gold-300 hover:text-gold-200 underline underline-offset-4 transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
