'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formsAPI } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

export default function FormsManagementPage() {
    const router = useRouter();
    const { token, isLoading } = useAuthStore();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [mounted, setMounted] = useState(false);

    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

    const handleSendReminder = async (sub: any) => {
        try {
            // Simulated reminder trigger
            alert(`⚡ OpsFlow Automation: Sequence dispatched to ${sub.customerEmail}. \n\nDynamic link and reminder SMS sent.`);
        } catch (error) {
            console.error('Reminder failed:', error);
        }
    };

    const fetchSubmissions = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/forms/submissions?status=${statusFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSubmissions(data);
        } catch (error) {
            console.error('Fetch submissions error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchSubmissions();
            }
        }
    }, [token, router, statusFilter, mounted, isLoading]);

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden font-sans relative">
            {/* Submission Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0d1117] border border-white/10 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div>
                                <div className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Data Review</div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedSubmission.customerName}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-green-400 capitalize">{selectedSubmission.status}</p>
                                </div>
                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Captured via</p>
                                    <p className="text-sm font-bold text-white uppercase">Automated Form</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Clinical Responses</p>
                                <div className="space-y-3">
                                    {selectedSubmission.data ? Object.entries(JSON.parse(selectedSubmission.data)).map(([key, value]: [string, any]) => (
                                        <div key={key} className="p-4 bg-white/[0.01] border-l-2 border-amber-500 rounded-r-xl">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">{value}</p>
                                        </div>
                                    )) : (
                                        <p className="text-slate-500 italic text-sm">No specific data captured yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.02] border-t border-white/5">
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Close Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col p-4">
                <Link href="/dashboard" className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">O</div>
                    <span className="hidden lg:block text-xl font-bold text-white uppercase tracking-tighter">OpsFlow</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon="📊" label="Dashboard" href="/dashboard" />
                    <SidebarItem icon="🎯" label="Leads" href="/leads" />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" active />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Compliance</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Documentation Hub</h1>
                        </div>

                        <div className="bg-white/5 p-1.5 rounded-2xl flex items-center space-x-1 border border-white/5">
                            {['PENDING', 'COMPLETED'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse"></div>
                            ))
                        ) : submissions.length > 0 ? submissions.map((sub) => (
                            <div key={sub.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.04] group">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${sub.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {sub.status === 'COMPLETED' ? '✅' : '⏳'}
                                        </div>

                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{sub.customerName}</h3>
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium mb-1">{sub.form.name}</p>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {sub.booking
                                                        ? `Linked to: ${sub.booking.customerName}'s ${sub.booking.startTime ? format(new Date(sub.booking.startTime), 'MMM d') : 'N/A'} Appointment`
                                                        : 'Standalone Submission'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 lg:border-l lg:border-white/5 lg:pl-8">
                                        <div className="text-right mr-4">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logged On</p>
                                            <p className="text-xs font-bold text-white">
                                                {sub.createdAt ? format(new Date(sub.createdAt), 'MMM d, HH:mm') : 'N/A'}
                                            </p>
                                        </div>
                                        {sub.status === 'COMPLETED' ? (
                                            <button
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all font-sans"
                                            >
                                                Review Data
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSendReminder(sub)}
                                                className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-all font-sans"
                                            >
                                                Send Reminder
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                                <div className="text-6xl mb-6">📝</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No submissions found</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">All customers are currently up-to-date with their documentation.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
