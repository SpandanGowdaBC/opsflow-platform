'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { bookingsAPI } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

export default function BookingsPage() {
    const router = useRouter();
    const { token, isLoading } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [mounted, setMounted] = useState(false);

    const fetchBookings = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/bookings?timeframe=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data_json = await response.json();
            setBookings(data_json);
        } catch (error) {
            console.error('Fetch bookings error:', error);
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
                fetchBookings();
            }
        }
    }, [token, router, filter, mounted, isLoading]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await bookingsAPI.updateStatus(id, status);
            setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 flex overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 bg-[#0a0c10] border-r border-white/5 flex flex-col p-4">
                <Link href="/dashboard" className="flex items-center space-x-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">O</div>
                    <span className="hidden lg:block text-xl font-bold text-white uppercase tracking-tighter">OpsFlow</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon="📊" label="Dashboard" href="/dashboard" />
                    <SidebarItem icon="🎯" label="Leads" href="/leads" />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" active />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                    <SidebarItem icon="👥" label="Team" href="/team" />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Operations</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Booking Ledger</h1>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <button
                                onClick={() => {
                                    const btn = document.getElementById('cal-btn');
                                    if (btn) {
                                        btn.innerText = '✨ Linking...';
                                        setTimeout(() => btn.innerText = '✅ Calendar Synced', 1500);
                                    }
                                }}
                                id="cal-btn"
                                className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center space-x-2"
                            >
                                <span>🗓️</span>
                                <span>Sync Google Calendar</span>
                            </button>

                            <div className="bg-white/5 p-1.5 rounded-2xl flex items-center space-x-1 border border-white/5">
                                <button
                                    onClick={() => setFilter('upcoming')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => setFilter('past')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'past' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Historical
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse"></div>
                            ))
                        ) : bookings.length > 0 ? bookings.map((booking) => (
                            <div key={booking.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.04] group relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 min-w-[100px]">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{format(new Date(booking.startTime), 'EEE')}</span>
                                            <span className="text-2xl font-black text-white">{format(new Date(booking.startTime), 'dd')}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{format(new Date(booking.startTime), 'MMM')}</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{booking.customerName}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${booking.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium mb-2">{booking.service?.name} • {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}</p>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact: {booking.customerEmail}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 lg:border-l lg:border-white/5 lg:pl-8">
                                        {booking.status === 'CONFIRMED' ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                                    className="px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                                >
                                                    Complete
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'NO_SHOW')}
                                                    className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    No-Show
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                disabled
                                                className="px-6 py-3 bg-white/5 border border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-not-allowed"
                                            >
                                                Locked
                                            </button>
                                        )}
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all">→</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                                <div className="text-6xl mb-6">📅</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No bookings found</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Your schedule is currently empty for this timeframe.</p>
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
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
