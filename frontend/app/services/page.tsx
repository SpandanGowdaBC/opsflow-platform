'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

export default function ServicesPage() {
    const router = useRouter();
    const { token, isLoading } = useAuthStore();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newService, setNewService] = useState({ name: '', description: '', duration: 60, price: 100 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading) {
            if (!token) {
                router.push('/login');
            } else {
                fetchServices();
            }
        }
    }, [token, router, mounted, isLoading]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await servicesAPI.getAll();
            setServices(data);
        } catch (error) {
            console.error('Fetch services error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await servicesAPI.create(newService);
            setShowModal(false);
            setNewService({ name: '', description: '', duration: 60, price: 100 });
            fetchServices();
        } catch (error) {
            alert('Failed to create service');
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
                    <SidebarItem icon="🎯" label="Leads" href="/leads" />
                    <SidebarItem icon="📅" label="Bookings" href="/bookings" />
                    <SidebarItem icon="💬" label="Inbox" href="/messages" />
                    <SidebarItem icon="📝" label="Forms" href="/forms" />
                    <SidebarItem icon="📦" label="Inventory" href="/inventory" />
                    <SidebarItem icon="🛠️" label="Services" href="/services" active />
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Offerings</div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">Content Creation</h1>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl shadow-white/10"
                        >
                            + New Service
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse"></div>
                            ))
                        ) : services.length > 0 ? services.map((service) => (
                            <div key={service.id} className="group relative bg-[#0f1218] border border-white/5 rounded-[32px] p-8 transition-all hover:bg-white/[0.03] hover:border-white/10 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">
                                        ✨
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white">${service.price}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{service.duration} MIN</div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6">{service.description}</p>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${service.isActive ? 'text-green-500' : 'text-slate-500'}`}>
                                        {service.isActive ? '● Live' : '● Draft'}
                                    </span>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                                        Edit Details →
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                                <div className="text-6xl mb-6">✨</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No Services Defined</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Create your first service offering to start accepting bookings.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0a0c10] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Create Offering</h2>
                            <form onSubmit={handleCreateService} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="e.g. Executive Strategy Session"
                                        value={newService.name}
                                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24"
                                        value={newService.description}
                                        onChange={e => setNewService({ ...newService, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Price ($)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            value={newService.price}
                                            onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Duration (min)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            value={newService.duration}
                                            onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-600/20">Publish Service</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className="text-lg leading-none">{icon}</span>
            <span className="hidden lg:block text-sm font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
