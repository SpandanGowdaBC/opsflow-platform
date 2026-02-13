'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { leadsAPI, messagesAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function LeadsPage() {
    const router = useRouter();
    const { token, isLoading } = useAuthStore();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('NEW');
    const [mounted, setMounted] = useState(false);

    const fetchLeads = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await leadsAPI.getAll({ status: filter });
            setLeads(data);
        } catch (error) {
            console.error('Fetch leads error:', error);
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
                fetchLeads();
            }
        }
    }, [token, router, filter, mounted, isLoading]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await leadsAPI.updateStatus(id, status);
            // Optimistic update
            setLeads(prevLeads => prevLeads.filter(l => l.id !== id));
            alert(`✅ Lead status updated to ${status}.`);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleMessageLead = async (lead: any) => {
        try {
            const conversation = await messagesAPI.findOrCreate({
                email: lead.email,
                name: `${lead.firstName} ${lead.lastName}`,
                phone: lead.phone
            });
            router.push(`/messages?id=${conversation.id}`);
        } catch (error) {
            console.error('Failed to link conversation:', error);
            alert('Could not open communication channel.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden font-sans">
            <aside className="w-20 lg:w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col p-4">
                <Link href="/dashboard" className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">O</div>
                    <span className="hidden lg:block text-xl font-bold text-white uppercase tracking-tighter">OpsFlow</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon="📊" label="Dashboard" href="/dashboard" />
                    <SidebarItem icon="🎯" label="Leads" href="/leads" active />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Acquisition</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Lead Pipeline</h1>
                        </div>

                        <div className="bg-white/5 p-1.5 rounded-2xl flex items-center space-x-1 border border-white/5">
                            {['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
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
                        ) : leads.length > 0 ? leads.map((lead) => (
                            <div key={lead.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 lg:p-8 transition-all hover:bg-white/[0.04] group relative">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-blue-500/20 to-indigo-600/10 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            {lead.firstName?.[0] || 'L'}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{lead.firstName} {lead.lastName}</h3>
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded border border-blue-500/20">{lead.source}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                <p className="text-sm text-slate-400 font-medium">Interest: <span className="text-slate-200">{lead.serviceInterest || 'General Inquiry'}</span></p>
                                                <p className="text-sm text-slate-500 font-medium">{lead.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:border-l lg:border-white/5 lg:pl-10">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Inbound</span>
                                            <span className="text-xs font-bold text-slate-300">{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {filter === 'NEW' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}
                                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/10"
                                                >
                                                    Mark Contacted
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleMessageLead(lead)}
                                                className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
                                                title="Open Unified Inbox"
                                            >
                                                💬
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5 text-xs text-slate-500 leading-relaxed italic">
                                    "{lead.message || 'No additional details provided.'}"
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                                <div className="text-6xl mb-6">🎯</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Pipeline Clear</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">You've reached the end of the queue. Great job!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
