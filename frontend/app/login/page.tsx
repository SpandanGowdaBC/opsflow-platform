'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth, token, isLoading, business } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && token) {
            if (business?.onboardingComplete) {
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        }
    }, [mounted, isLoading, token, business, router]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            setAuth(response.token, response.user, response.business);

            // Redirect based on onboarding status
            if (response.business.onboardingComplete) {
                router.push('/dashboard');
            } else {
                router.push('/onboarding');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10 group">
                <div className="absolute inset-0 bg-blue-600/5 blur-3xl group-hover:bg-blue-600/10 transition-all"></div>

                <div className="bg-[#0d1117]/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 md:p-12 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16"></div>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[30px] mb-8 shadow-2xl shadow-blue-500/20 transform hover:scale-110 transition-all duration-500">
                            <span className="text-white font-black text-4xl">O</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">OpsFlow</h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest leading-none">Command Center Access</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Enter Console →'}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            New User?{' '}
                            <Link href="/register" className="text-blue-500 hover:text-blue-400 transition-colors">
                                Create Account
                            </Link>
                        </p>
                        <Link href="/" className="block text-[10px] font-black text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-[0.2em]">
                            ← Return to Observatory
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
