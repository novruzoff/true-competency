'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Role = 'resident' | 'attending' | 'committee';

export default function SignInPage() {
  const [mode, setMode] = useState<'signin'|'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('resident');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function upsertRole(userId: string, role: Role) {
    // profiles row is created by trigger; update chosen role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await upsertRole(data.user.id, role);
          setMsg('Account created. You can now sign in.');
          setMode('signin');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          // go to dashboard (or /topics for now)
          window.location.href = '/';
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Something went wrong';
      setMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">True Competency</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('signup')}
          className={`px-3 py-1 rounded ${mode==='signup'?'bg-black text-white':'border'}`}
        >Create account</button>
        <button
          onClick={() => setMode('signin')}
          className={`px-3 py-1 rounded ${mode==='signin'?'bg-black text-white':'border'}`}
        >Sign in</button>
      </div>

      {mode === 'signup' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">I am a:</p>
          <div className="grid grid-cols-1 gap-2">
            {(['resident','attending','committee'] as Role[]).map(r => (
              <label key={r} className={`flex items-center gap-2 p-2 rounded border ${role===r?'border-black':''}`}>
                <input type="radio" name="role" value={r}
                  checked={role===r} onChange={() => setRole(r)} />
                <span className="capitalize">{r}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="doctor@hospital.com"
          type="email" value={email} onChange={e=>setEmail(e.target.value)} required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password" value={password} onChange={e=>setPassword(e.target.value)} required
        />
        <button disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50">
          {loading ? 'Please wait…' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm">{msg}</p>}

      <p className="mt-6 text-sm text-gray-600">
        Demo tip: disable email confirmations in Supabase Auth → Settings to avoid verify emails during dev.
      </p>
    </main>
  );
}
