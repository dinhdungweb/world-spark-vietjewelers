'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Redirect to admin panel or callback URL
      const callbackUrl = searchParams.get('callbackUrl') || '/admin';
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium text-white tracking-tight">
            Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            World Spark Moderation
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:ring-0 transition-all duration-200"
                placeholder="Email address"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:ring-0 transition-all duration-200"
                placeholder="Password"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
              <p className="text-center text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
